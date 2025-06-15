// questions.js

const quizQuestions = [
    {
        question: "Who is known as the Father of the Indian Constitution?",
        options: ["Mahatma Gandhi", "B. R. Ambedkar", "Jawaharlal Nehru", "Sardar Vallabhbhai Patel"],
        answer: "B. R. Ambedkar"
    },
    {
        question: "Which organ in the human body purifies blood?",
        options: ["Lungs", "Heart", "Liver", "Kidneys"],
        answer: "Kidneys"
    },
    {
        question: "What is the value of π (pi) up to two decimal places?",
        options: ["3.12", "3.14", "3.16", "3.18"],
        answer: "3.14"
    },
    {
        question: "Which is the longest river in the world?",
        options: ["Amazon", "Nile", "Yangtze", "Mississippi"],
        answer: "Nile"
    },
    {
        question: "Who was the first President of the United States?",
        options: ["Abraham Lincoln", "George Washington", "Thomas Jefferson", "John Adams"],
        answer: "George Washington"
    },
    {
        question: "What is the plural form of “child”?",
        options: ["Childs", "Childes", "Children", "Childrens"],
        answer: "Children"
    },
    {
        question: "What comes next in the series: 2, 4, 8, 16, ?",
        options: ["18", "24", "32", "30"],
        answer: "32"
    },
    {
        question: "What is the chemical symbol of Gold?",
        options: ["Gd", "Go", "Au", "Ag"],
        answer: "Au"
    },
    {
        question: "Which planet is known as the “Red Planet”?",
        options: ["Venus", "Earth", "Mars", "Jupiter"],
        answer: "Mars"
    },
    {
        question: "Who wrote the play 'Romeo and Juliet'?",
        options: ["Charles Dickens", "William Shakespeare", "Leo Tolstoy", "George Orwell"],
        answer: "William Shakespeare"
    },
    {
        question: "Which vitamin is produced when the skin is exposed to sunlight?",
        options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"],
        answer: "Vitamin D"
    },
    {
        question: "What part of the cell contains DNA?",
        options: ["Cytoplasm", "Nucleus", "Cell membrane", "Mitochondria"],
        answer: "Nucleus"
    },
    {
        question: "Which part of the plant conducts photosynthesis?",
        options: ["Roots", "Stem", "Leaves", "Flowers"],
        answer: "Leaves"
    },
    {
        question: "Which gas do plants absorb from the atmosphere?",
        options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
        answer: "Carbon Dioxide"
    },
    {
        question: "What force keeps us on the ground?",
        options: ["Magnetism", "Electricity", "Gravity", "Inertia"],
        answer: "Gravity"
    },
    {
        question: "What part of the human body is responsible for pumping blood?",
        options: ["Brain", "Lungs", "Liver", "Heart"],
        answer: "Heart"
    },
    {
        question: "What is the speed of light in a vacuum?",
        options: ["300,000 km/s", "150,000 km/s", "30,000 km/s", "3,000 km/s"],
        answer: "300,000 km/s"
    },
    {
        question: "Which planet is the largest in our Solar System?",
        options: ["Earth", "Saturn", "Jupiter", "Neptune"],
        answer: "Jupiter"
    },
    {
        question: "Which gas makes up most of the Earth's atmosphere?",
        options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
        answer: "Nitrogen"
    },
    {
        question: "Which element has the chemical symbol 'O'?",
        options: ["Oxygen", "Osmium", "Gold", "Oganesson"],
        answer: "Oxygen"
    },
    {
        question: "Which of the following particles has the least mass?",
        options: ["Proton", "Neutron", "Electron", "Alpha particle"],
        answer: "Electron"
    },
    {
        question: "In what organelle does cellular respiration take place?",
        options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Apparatus"],
        answer: "Mitochondria"
    },
    {
        question: "What is the main component of the sun?",
        options: ["Oxygen", "Carbon", "Hydrogen", "Helium"],
        answer: "Hydrogen"
    },
    {
        question: "How many chromosomes does a typical human cell contain?",
        options: ["23", "46", "44", "22"],
        answer: "46"
    },
    {
        question: "Which type of blood cell is responsible for fighting infections?",
        options: ["Red Blood Cells", "White Blood Cells", "Platelets", "Plasma"],
        answer: "White Blood Cells"
    },
    {
        question: "What is the capital of Canada?",
        options: ["Toronto", "Vancouver", "Ottawa", "Montreal"],
        answer: "Ottawa"
    },
    {
        question: "Who painted the Mona Lisa?",
        options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
        answer: "Leonardo da Vinci"
    },
    {
        question: "What is the largest ocean on Earth?",
        options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
        answer: "Pacific Ocean"
    },
    {
        question: "Which ancient wonder was located in Babylon and known for its terraced gardens?",
        options: ["Colossus of Rhodes", "Hanging Gardens", "Great Pyramid of Giza", "Lighthouse of Alexandria"],
        answer: "Hanging Gardens"
    },
    {
        question: "Which country gifted the Statue of Liberty to the United States?",
        options: ["Spain", "France", "England", "Italy"],
        answer: "France"
    },
    {
        question: "What is the hardest natural substance on Earth?",
        options: ["Gold", "Diamond", "Iron", "Quartz"],
        answer: "Diamond"
    },
    {
        question: "What does GDP stand for?",
        options: ["Gross Domestic Product", "General Demand Principle", "Government Debt Percentage", "Global Development Plan"],
        answer: "Gross Domestic Product"
    },
    {
        question: "Which economist is known as the 'father of modern economics'?",
        options: ["John Maynard Keynes", "Milton Friedman", "Adam Smith", "Karl Marx"],
        answer: "Adam Smith"
    },
    {
        question: "What is the primary tool used by central banks to control inflation?",
        options: ["Fiscal policy", "Interest rates", "Tariffs", "Price ceilings"],
        answer: "Interest rates"
    },
    {
        question: "Which of these is NOT a type of unemployment?",
        options: ["Frictional", "Cyclical", "Structural", "Proportional"],
        answer: "Proportional"
    },
    {
        question: "The 'Phillips Curve' illustrates the relationship between what two economic factors?",
        options: ["Inflation and unemployment", "Supply and demand", "GDP and interest rates", "Imports and exports"],
        answer: "Inflation and unemployment"
    },
    {
        question: "What does a 'regressive tax' system mean?",
        options: ["Higher earners pay a larger percentage", "Everyone pays the same percentage", "Lower earners pay a larger percentage", "Taxes decrease over time"],
        answer: "Lower earners pay a larger percentage"
    },
    {
        question: "Which organization sets the 'Basel Accords' for global banking standards?",
        options: ["IMF", "World Bank", "Bank for International Settlements", "Federal Reserve"],
        answer: "Bank for International Settlements"
    },
    {
        question: "The 'Lorenz Curve' is used to measure what?",
        options: ["Inflation", "Income inequality", "Trade deficits", "Consumer confidence"],
        answer: "Income inequality"
    },
    {
        question: "What is 'quantitative easing'?",
        options: ["Printing more physical currency", "Central banks buying assets to inject money into the economy", "Reducing taxes to stimulate spending", "Limiting imports to protect domestic industries"],
        answer: "Central banks buying assets to inject money into the economy"
    },
    {
        question: "The 'Gini coefficient' measures what?",
        options: ["Poverty rates", "Income distribution equality", "GDP growth", "Unemployment duration"],
        answer: "Income distribution equality"
    },
    {
        question: "The 'J-curve effect' in economics refers to what phenomenon?",
        options: ["Short-term worsening of trade balance after currency depreciation", "Long-term GDP growth after a recession", "Inflation spikes following tax cuts", "Stock market recovery after a crash"],
        answer: "Short-term worsening of trade balance after currency depreciation"
    },
    {
        question: "What is the 'endowment effect'?",
        options: ["Valuing something more once you own it", "Spending more when prices are rounded", "Preferring short-term gains over long-term benefits", "Following trends in financial markets"],
        answer: "Valuing something more once you own it"
    },
    {
        question: "Which cognitive bias describes people's tendency to rely heavily on the first piece of information offered?",
        options: ["Confirmation bias", "Anchoring effect", "Hindsight bias", "Availability heuristic"],
        answer: "Anchoring effect"
    },
    {
        question: "The 'ultimatum game' demonstrates that people:",
        options: ["Always act in their rational self-interest", "Reject unfair offers even at personal cost", "Prefer lottery-style uncertainty", "Value future rewards more than immediate ones"],
        answer: "Reject unfair offers even at personal cost"
    },
    {
        question: "What does 'hyperbolic discounting' refer to?",
        options: ["Overestimating small probabilities", "Preferring immediate rewards disproportionately", "Avoiding losses more than seeking equivalent gains", "Mimicking others' financial decisions"],
        answer: "Preferring immediate rewards disproportionately"
    },
    {
        question: "The 'Dunning-Kruger effect' explains:",
        options: ["Why people overestimate their knowledge/skills", "How framing affects risk assessment", "The impact of social proof on spending", "Mental accounting of money"],
        answer: "Why people overestimate their knowledge/skills"
    },
    {
        question: "Which concept explains why people work harder to avoid losses than to achieve gains?",
        options: ["Prospect theory", "Pareto efficiency", "Moral hazard", "Price anchoring"],
        answer: "Prospect theory"
    },
    {
        question: "Choice overload' occurs when:",
        options: ["Too many options reduce decision quality", "Prices exceed willingness to pay", "Information is asymmetrical", "Sunk costs influence decisions"],
        answer: "Too many options reduce decision quality"
    },
    {
        question: "What behavioral principle do 'nudges' leverage?",
        options: ["Changing default options to guide decisions", "Eliminating all choice alternatives", "Using financial penalties exclusively", "Requiring mandatory cooling-off periods"],
        answer: "Changing default options to guide decisions"
    },
    {
        question: "The 'hot-cold empathy gap' refers to:",
        options: ["Underestimating how emotions affect decisions", "Seasonal fluctuations in consumer spending", "Misjudging others' risk tolerance", "Overvaluing recent information"],
        answer: "Underestimating how emotions affect decisions"
    },
    {
        question: "Which experiment demonstrated 'loss aversion' using mugs and chocolates?",
        options: ["Stanford marshmallow experiment", "Kahneman & Tversky's studies", "Milgram obedience experiment", "Asch conformity experiment"],
        answer: "Kahneman & Tversky's studies"
    },
    {
        question: "What does 'mental accounting' violate in traditional economics?",
        options: ["Law of diminishing returns", "Fungibility of money", "Rational expectations", "Pareto optimality"],
        answer: "Fungibility of money"
    },
    {
        question: "Which country has the most time zones?",
        options: ["United States", "China", "Russia", "France"],
        answer: "France"
    },
    {
        question: "The Darién Gap separates which two continents?",
        options: ["North America and South America", "Europe and Asia", "Africa and Asia", "Asia and Oceania"],
        answer: "North America and South America"
    },
    {
        question: "What is the only sea without coasts?",
        options: ["Sargasso Sea", "Dead Sea", "Coral Sea", "Black Sea"],
        answer: "Sargasso Sea"
    },
    {
        question: "Which river flows through the most countries?",
        options: ["Nile", "Amazon", "Danube", "Congo"],
        answer: "Danube"
    }
];