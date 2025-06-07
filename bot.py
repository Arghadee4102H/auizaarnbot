import logging
import json
import datetime
import re
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo, LabeledPrice, StarsTransactionContextProduct
from telegram.ext import Application, CommandHandler, MessageHandler, filters, CallbackContext, PreCheckoutQueryHandler, CallbackQueryHandler
import mysql.connector # For database interaction

# --- Configuration ---
# !! IMPORTANT: REPLACE THESE WITH YOUR ACTUAL VALUES !!
BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"  # Same token as in api.php
WEB_APP_URL = "YOUR_WEB_APP_URL"  # e.g., https://yourdomain.com/AuizAarnBot/ or http://t.me/AuizAarnBot/aarn (if using TG direct)
                                     # Ensure this matches what you set in BotFather for your web app

# Database Configuration (from InfinityFree)
DB_HOST = "YOUR_DB_SERVER" # e.g., sqlXXX.infinityfree.com
DB_USER = "YOUR_DB_USERNAME" # e.g., if0_39073218
DB_PASSWORD = "YOUR_DB_PASSWORD"
DB_NAME = "YOUR_DB_NAME" # e.g., if0_39073218_auizaarnbot_db

# Setup logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# --- Database Connection ---
def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        return conn
    except mysql.connector.Error as err:
        logger.error(f"Database Connection Error: {err}")
        return None

# --- Helper Functions ---
def get_user_from_db(user_id):
    conn = get_db_connection()
    if not conn:
        return None
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        return user
    except mysql.connector.Error as err:
        logger.error(f"Error fetching user {user_id}: {err}")
        return None
    finally:
        cursor.close()
        conn.close()

def update_user_premium_status(user_id, premium_type, stars_spent, purchase_details):
    conn = get_db_connection()
    if not conn:
        return False
    cursor = conn.cursor()
    today = datetime.date.today()
    
    try:
        # Log the premium purchase
        sql_log = """
            INSERT INTO premium_purchases 
            (user_id, premium_type, stars_spent, points_gained, quiz_limit_bonus_gained, energy_bonus_gained, duration_days, purchase_timestamp)
            VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
        """
        cursor.execute(sql_log, (
            user_id,
            premium_type,
            stars_spent,
            purchase_details.get('points', 0),
            purchase_details.get('quiz_limit', 0),
            purchase_details.get('energy', 0),
            purchase_details.get('duration_days', None)
        ))

        # Update user table based on premium type
        if premium_type == 'boost':
            # +2 quiz extras, +1 energy (for today)
            # boost_premium_uses_today is incremented
            # current_energy and max_quizzes_today are affected
            # max_quizzes_today is dynamic, but we need to ensure boost_premium_uses_today is tracked
            sql_update = """
                UPDATE users 
                SET current_energy = current_energy + %s,
                    boost_premium_uses_today = boost_premium_uses_today + 1
                WHERE user_id = %s
            """
            cursor.execute(sql_update, (purchase_details['energy'], user_id))

        elif premium_type == 'day':
            # +20 quiz extras, +7 energy (for today)
            # day_premium_uses_today is incremented
            sql_update = """
                UPDATE users 
                SET current_energy = current_energy + %s,
                    day_premium_uses_today = day_premium_uses_today + 1
                WHERE user_id = %s
            """
            cursor.execute(sql_update, (purchase_details['energy'], user_id))

        elif premium_type == 'weekly':
            # +145 quiz extras, +50 energy (for 7 days)
            expiry_date = today + datetime.timedelta(days=7)
            sql_update = """
                UPDATE users 
                SET current_energy = current_energy + %s,
                    weekly_premium_active = 1,
                    weekly_premium_start_date = %s,
                    weekly_premium_expiry_date = %s
                WHERE user_id = %s
            """
            cursor.execute(sql_update, (purchase_details['energy'], today, expiry_date, user_id))
        
        conn.commit()
        logger.info(f"User {user_id} granted {premium_type} premium.")
        return True
    except mysql.connector.Error as err:
        conn.rollback()
        logger.error(f"DB Error updating premium for {user_id}, type {premium_type}: {err}")
        return False
    finally:
        cursor.close()
        conn.close()

# --- Command Handlers ---
async def start_command(update: Update, context: CallbackContext) -> None:
    user = update.effective_user
    logger.info(f"User {user.id} ({user.username}) started the bot.")
    
    # Check for deep linking parameters (e.g., from WebApp premium purchase initiation)
    # Example: t.me/YourBotName?start=premium_boost_3_USERID
    # This part is mostly if you want the bot to *initiate* something from a /start command itself.
    # The WebApp now sends a message with an inline button, so this deep link logic for /start might be less critical
    # for the payment flow, but good to have for general /start.
    
    # For WebApp, always show the button to open it
    keyboard = [[InlineKeyboardButton("🚀 Open Auiz Aarn App", web_app=WebAppInfo(url=WEB_APP_URL))]]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    start_message = (
        f"Welcome to Auiz Aarn Bot, {user.mention_html()}!\n\n"
        "Tap the button below to open the app, play quizzes, earn points, and manage your account."
    )
    await update.message.reply_html(start_message, reply_markup=reply_markup)


async def web_app_data(update: Update, context: CallbackContext) -> None:
    """Handles data received from the Web App."""
    # This handler is invoked when the Web App sends data back to the bot via `window.Telegram.WebApp.sendData()`.
    # We are not heavily relying on this for now, as most interactions are API calls from WebApp to api.php.
    # But it can be useful for specific bot-side actions triggered by WebApp.
    data = json.loads(update.message.web_app_data.data)
    user = update.effective_user
    logger.info(f"Received WebApp data from {user.id}: {data}")
    await update.message.reply_text(f"Received your data from the WebApp: \n{json.dumps(data, indent=2)}")


# --- Callback Query Handler (for inline buttons) ---
async def button_callback_handler(update: Update, context: CallbackContext) -> None:
    query = update.callback_query
    await query.answer() # Acknowledge the callback
    user_id = query.from_user.id
    
    # Expected callback_data format: "pay_stars_{type}_{stars}"
    # e.g., "pay_stars_boost_3"
    data_parts = query.data.split('_')
    
    if len(data_parts) == 4 and data_parts[0] == 'pay' and data_parts[1] == 'stars':
        premium_type = data_parts[2]
        try:
            stars_amount = int(data_parts[3])
        except ValueError:
            await query.edit_message_text(text="Invalid stars amount in callback.")
            return

        logger.info(f"User {user_id} initiated Stars payment for {premium_type} ({stars_amount} Stars).")

        title = ""
        description = ""
        # These benefits are for display on invoice; actual granting happens after SuccessfulPayment
        purchase_details_for_invoice = {} 

        if premium_type == 'boost':
            title = "Boost Premium"
            description = "Get +2 Quiz Extras & +1 Energy. Valid for today."
            purchase_details_for_invoice = {'quiz_limit': 2, 'energy': 1, 'stars': stars_amount}
        elif premium_type == 'day':
            title = "Day Premium"
            description = "Get +20 Quiz Extras & +7 Energy. Valid for today."
            purchase_details_for_invoice = {'quiz_limit': 20, 'energy': 7, 'stars': stars_amount}
        elif premium_type == 'weekly':
            title = "Weekly Premium"
            description = "Get +145 Quiz Extras & +50 Energy. Valid for 7 days."
            purchase_details_for_invoice = {'quiz_limit': 145, 'energy': 50, 'duration_days': 7, 'stars': stars_amount}
        else:
            await query.edit_message_text(text="Unknown premium type.")
            return

        # Payload for PreCheckoutQuery and SuccessfulPayment
        # Needs to be unique and allow us to identify the purchase
        payload = f"stars_{premium_type}_{user_id}_{stars_amount}_{datetime.datetime.now().timestamp()}"

        prices = [LabeledPrice(label=title, amount=stars_amount)] # Amount is number of stars

        try:
            await context.bot.send_invoice(
                chat_id=user_id,
                title=title,
                description=description,
                payload=payload,
                currency="XTR", # XTR for Stars
                prices=prices,
                # provider_token="", # Not needed for XTR
                # start_parameter="start_param_if_needed", # Optional
            )
            # Remove the inline button message after sending invoice or edit it
            await query.edit_message_text(text="Payment invoice sent! Please complete the payment in the new message.")
        except Exception as e:
            logger.error(f"Error sending invoice for {user_id}, type {premium_type}: {e}")
            await query.edit_message_text(text=f"Sorry, an error occurred while creating your payment request: {e}")
    else:
        await query.edit_message_text(text=f"Received unknown callback: {query.data}")


# --- Payment Handlers ---
async def precheckout_callback(update: Update, context: CallbackContext) -> None:
    """Handles PreCheckoutQuery from Telegram."""
    query = update.pre_checkout_query
    # Payload format: "stars_{type}_{user_id}_{stars_amount}_{timestamp}"
    payload_parts = query.invoice_payload.split('_')
    
    if query.currency != "XTR":
        await query.answer(ok=False, error_message="Sorry, we only accept Stars (XTR) for this payment.")
        logger.warning(f"PreCheckout rejected for {query.from_user.id}: incorrect currency {query.currency}")
        return

    if len(payload_parts) < 4 or payload_parts[0] != 'stars':
        await query.answer(ok=False, error_message="Invalid payment payload. Please try again.")
        logger.warning(f"PreCheckout rejected for {query.from_user.id}: invalid payload {query.invoice_payload}")
        return
        
    premium_type = payload_parts[1]
    # user_id_from_payload = int(payload_parts[2]) # Can verify if query.from_user.id matches
    stars_amount_from_payload = int(payload_parts[3])

    # Check if the user has enough stars (Telegram does this, but good for logs)
    # Note: query.total_amount is in the smallest unit of currency. For XTR, it's the number of stars.
    if query.total_amount != stars_amount_from_payload:
        await query.answer(ok=False, error_message="Payment amount mismatch. Please try again.")
        logger.warning(f"PreCheckout rejected for {query.from_user.id}: amount mismatch (expected {stars_amount_from_payload}, got {query.total_amount})")
        return

    # Here you can do additional checks:
    # - Is the item still available?
    # - Does the user meet criteria for this purchase (e.g., daily limits for boost/day)?
    #   This check is also in api.php before sending the button, but a final check here is good.
    
    user_db_id = query.from_user.id # User ID performing the checkout
    user_data = get_user_from_db(user_db_id)
    if not user_data:
        await query.answer(ok=False, error_message="User not found in our system. Please restart the bot.")
        return

    if premium_type == 'boost' and user_data.get('boost_premium_uses_today', 0) >= 7:
        await query.answer(ok=False, error_message="You have reached the daily limit for Boost Premium.")
        return
    if premium_type == 'day' and user_data.get('day_premium_uses_today', 0) >= 1:
        await query.answer(ok=False, error_message="You have already purchased Day Premium today.")
        return
    if premium_type == 'weekly' and user_data.get('weekly_premium_active', False):
        # More robust check: ensure last weekly purchase was > 7 days ago if not using weekly_premium_active strictly
        # For simplicity, if 'weekly_premium_active' is true, we block.
        await query.answer(ok=False, error_message="Weekly Premium is already active or was purchased recently.")
        return

    await query.answer(ok=True)
    logger.info(f"PreCheckout successful for {query.from_user.id} for {premium_type} ({stars_amount_from_payload} Stars).")


async def successful_payment_callback(update: Update, context: CallbackContext) -> None:
    """Handles SuccessfulPayment from Telegram."""
    payment_info = update.message.successful_payment
    user_id = update.message.from_user.id
    
    logger.info(f"Successful payment from {user_id}: Currency: {payment_info.currency}, Amount: {payment_info.total_amount}, Payload: {payment_info.invoice_payload}")

    if payment_info.currency != "XTR":
        logger.error(f"Successful payment for non-XTR currency received from {user_id}: {payment_info.currency}")
        await context.bot.send_message(user_id, "There was an issue processing your payment (currency mismatch). Please contact support.")
        return

    # Payload format: "stars_{type}_{user_id_from_payload}_{stars_amount}_{timestamp}"
    payload_parts = payment_info.invoice_payload.split('_')
    if len(payload_parts) < 4 or payload_parts[0] != 'stars':
        logger.error(f"Invalid payload in successful payment from {user_id}: {payment_info.invoice_payload}")
        await context.bot.send_message(user_id, "There was an issue processing your payment (payload error). Please contact support.")
        return

    premium_type = payload_parts[1]
    # stars_user_id = int(payload_parts[2]) # User ID from payload, should match user_id
    stars_spent = int(payload_parts[3]) # Number of stars

    purchase_details = {}
    if premium_type == 'boost':
        purchase_details = {'energy': 1, 'quiz_limit': 2, 'stars': stars_spent} # quiz_limit is a conceptual grant
    elif premium_type == 'day':
        purchase_details = {'energy': 7, 'quiz_limit': 20, 'stars': stars_spent}
    elif premium_type == 'weekly':
        purchase_details = {'energy': 50, 'quiz_limit': (145 // 7) * 7, 'duration_days': 7, 'stars': stars_spent} # Ensure whole number of quizzes

    if update_user_premium_status(user_id, premium_type, stars_spent, purchase_details):
        success_message = f"Thank you for your purchase of {premium_type.capitalize()} Premium for {stars_spent} Stars! Your benefits have been applied.\n\nOpen the app to continue: "
        keyboard = [[InlineKeyboardButton("🚀 Open Auiz Aarn App", web_app=WebAppInfo(url=WEB_APP_URL))]]
        reply_markup = InlineKeyboardMarkup(keyboard)
        await context.bot.send_message(user_id, success_message, reply_markup=reply_markup)
    else:
        error_message = "Your payment was successful, but there was an error applying the premium benefits. Please contact support with this payload: " + payment_info.invoice_payload
        await context.bot.send_message(user_id, error_message)
        logger.error(f"Failed to update DB for user {user_id} after successful payment for {premium_type}.")


# --- Main Application Setup ---
def main() -> None:
    """Start the bot."""
    if not BOT_TOKEN or "YOUR_TELEGRAM_BOT_TOKEN" in BOT_TOKEN:
        logger.error("BOT_TOKEN is not configured. Please set it.")
        return
    if not WEB_APP_URL or "YOUR_WEB_APP_URL" in WEB_APP_URL:
        logger.error("WEB_APP_URL is not configured. Please set it.")
        return
    if not DB_HOST or "YOUR_DB_SERVER" in DB_HOST : # Basic check
        logger.error("Database configuration is incomplete. Please check DB_HOST, etc.")
        return


    application = Application.builder().token(BOT_TOKEN).build()

    # Command handlers
    application.add_handler(CommandHandler("start", start_command))

    # Message handler for Web App data
    application.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data))

    # CallbackQuery handler for inline buttons
    application.add_handler(CallbackQueryHandler(button_callback_handler))
    
    # Payment handlers
    application.add_handler(PreCheckoutQueryHandler(precheckout_callback))
    application.add_handler(MessageHandler(filters.SUCCESSFUL_PAYMENT, successful_payment_callback))

    logger.info("Bot is starting...")
    application.run_polling()


if __name__ == "__main__":
    main()