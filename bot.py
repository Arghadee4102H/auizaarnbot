# bot.py

import os
import logging
import json
from datetime import datetime, timedelta

from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo, PreCheckoutQuery, SuccessfulPayment
from aiogram.enums import ParseMode
from aiohttp import web

import firebase_admin
from firebase_admin import credentials, db

# --- Configuration ---
# Load from environment variables for security and flexibility
BOT_TOKEN = os.getenv("BOT_TOKEN")
WEBAPP_URL = os.getenv("WEBAPP_URL") # Your GitHub Pages URL
RENDER_URL = os.getenv("RENDER_EXTERNAL_URL") # Provided by Render

# Configure logging
logging.basicConfig(level=logging.INFO)

# --- Firebase Initialization ---
# The service account key is stored as a JSON string in an environment variable
service_account_info_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
if not service_account_info_json:
    raise ValueError("FIREBASE_SERVICE_ACCOUNT_JSON environment variable not set.")
if not BOT_TOKEN:
    raise ValueError("BOT_TOKEN environment variable not set.")
if not WEBAPP_URL:
    raise ValueError("WEBAPP_URL environment variable not set.")

service_account_info = json.loads(service_account_info_json)
cred = credentials.Certificate(service_account_info)
firebase_admin.initialize_app(cred, {
    'databaseURL': service_account_info['databaseURL']
})

# --- Bot and Dispatcher Initialization ---
bot = Bot(token=BOT_TOKEN, parse_mode=ParseMode.HTML)
dp = Dispatcher()

# --- Utility Functions ---
def log_history(user_id: str, source: str, points: int):
    """Logs a transaction to the user's history in Firebase."""
    history_ref = db.reference(f'users/{user_id}/history').push()
    history_ref.set({
        'source': source,
        'points': points,
        'timestamp': datetime.utcnow().isoformat()
    })

# --- Handlers ---
@dp.message(CommandStart())
async def command_start_handler(message: types.Message) -> None:
    """
    This handler is called when a user sends /start.
    It provides a button to open the Web App.
    """
    # Check for referral code in start_param
    start_param = message.text.split(" ")[1] if len(message.text.split()) > 1 else ""
    app_url = f"{WEBAPP_URL}?startapp={start_param}" if start_param else WEBAPP_URL

    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🚀 Open Auiz Aarn Bot", web_app=WebAppInfo(url=app_url))]
    ])

    await message.answer(
        "🎉 Welcome to <b>Auiz Aarn Bot!</b>\n\n"
        "Tap the button below to start playing quizzes, earning points, and winning rewards!",
        reply_markup=keyboard
    )

@dp.pre_checkout_query()
async def pre_checkout_query_handler(pre_checkout_query: PreCheckoutQuery):
    """
    Answers the pre-checkout query from Telegram.
    This is a required step for Telegram Stars payments.
    """
    # Here you can add checks, e.g., if the product is still available.
    # For now, we will approve all payments.
    await bot.answer_pre_checkout_query(pre_checkout_query.id, ok=True)
    logging.info(f"Handled pre-checkout query for user {pre_checkout_query.from_user.id}")


@dp.message(lambda message: message.successful_payment is not None)
async def successful_payment_handler(message: types.Message):
    """
    Handles a successful payment from Telegram Stars.
    This is where you grant the user their purchase.
    """
    payment_info = message.successful_payment
    payload = payment_info.invoice_payload
    user_id = str(message.from_user.id)
    user_ref = db.reference(f'users/{user_id}')
    
    logging.info(f"Successful payment from {user_id} with payload: {payload}")

    try:
        user_data = user_ref.get()
        if not user_data:
            logging.error(f"User {user_id} not found in database for successful payment.")
            await message.answer("An error occurred. We couldn't find your account data. Please restart the app.")
            return

        today = datetime.utcnow().strftime('%Y-%m-%d')
        premium_data = user_data.get('premium', {})
        updates = {}

        if payload.startswith('boost_1'):
            updates['quizLimit'] = user_data.get('quizLimit', 0) + 1
            updates['premium/boostPurchasesToday'] = premium_data.get('boostPurchasesToday', 0) + 1
            log_history(user_id, "Premium: Boost", 0)
            await message.answer("✅ <b>Success!</b> You've received +1 extra quiz for today.")

        elif payload.startswith('day_premium_15'):
            updates['quizLimit'] = user_data.get('quizLimit', 0) + 20
            updates['energy'] = user_data.get('energy', 0) + 7
            updates['premium/dayPurchasesToday'] = 1
            log_history(user_id, "Premium: Day", 0)
            await message.answer("✅ <b>Day Premium Activated!</b> You've received +20 quiz attempts and +7 energy for today.")

        elif payload.startswith('weekly_premium_100'):
            expiry_date = datetime.utcnow() + timedelta(days=7)
            updates['premium/weeklyPremium/active'] = True
            updates['premium/weeklyPremium/expiry'] = expiry_date.isoformat()
            # The daily reset logic in the frontend will handle setting the daily limits
            log_history(user_id, "Premium: Weekly", 0)
            await message.answer("✅ <b>Weekly Premium Activated!</b> Enjoy massive boosts for the next 7 days.")

        else:
            logging.warning(f"Unknown payload received: {payload}")
            await message.answer("An unknown error occurred with your purchase. Please contact support.")
            return
            
        # Apply the updates to Firebase
        user_ref.update(updates)
        logging.info(f"Updated user {user_id} with: {updates}")

    except Exception as e:
        logging.error(f"Error processing payment for user {user_id}: {e}")
        await message.answer("A critical error occurred while processing your payment. Please contact support.")


# --- AIOHTTP Web Server Setup for Render ---
async def on_startup(bot: Bot) -> None:
    """Function to run on startup. Sets the webhook."""
    webhook_url = f"{RENDER_URL}/webhook"
    await bot.set_webhook(webhook_url)
    logging.info(f"Webhook set to {webhook_url}")

async def webhook_handle(request):
    """Handles incoming requests from Telegram."""
    try:
        update = types.Update.model_validate(await request.json(), context={"bot": bot})
        await dp.feed_update(bot=bot, update=update)
        return web.Response(status=200)
    except Exception as e:
        logging.error(f"Error processing update: {e}")
        return web.Response(status=500)

def main():
    """Main function to start the bot and web server."""
    # Register startup hook to set the webhook
    dp.startup.register(on_startup)
    
    # Create web application
    app = web.Application()
    app.router.add_post("/webhook", webhook_handle)
    
    # Start web server
    port = int(os.environ.get('PORT', 8080))
    web.run_app(app, host="0.0.0.0", port=port)

if __name__ == "__main__":
    main()