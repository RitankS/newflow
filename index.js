import express from 'express';
import stripe from 'stripe';
import open from 'open';
import cron from 'node-cron'

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());



app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
    res.send('products api running new deploy');
});

app.get('/ping', (req, res) => {
    res.send('PONG');
});

app.post("/pay", async (req, res) => {
    const STRIPE_KEY = "sk_test_51Nv0dVSHUS8UbeVicJZf3XZJf72DL9Fs3HP1rXnQzHtaXxMKXwWfua2zi8LQjmmboeNJc3odYs7cvT9Q5YIChY5I00Pocly1O1";
    const { price, name, custName, email } = req.body;
    const Stripe = new stripe(STRIPE_KEY);

    try {
        const newPrice = Math.ceil(parseFloat(price));

        const customer = await Stripe.customers.create({
            name: custName,
        });
        const custId = customer.id
        const myPrice = await Stripe.prices.create({
            currency: 'INR',
            unit_amount: newPrice,
            product_data: {
                name: name,
            },
        });

        const priceId = myPrice.id;
        const session = await Stripe.checkout.sessions.create({
            success_url: 'https://example.com/success',
            line_items: [
                {
                    price: priceId,
                    quantity: 10,
                },
            ],
            mode: 'payment',
        });
        res.status(200).json(({ priceId, email, session }));
    }
    catch (err) {
        res.status(500).json(err.message)
    }
});



let urlArr = [];
let quoteDetails = {};

// Endpoint to retrieve urlArr
app.get('/get-urls', (req, res) => {
    res.json({ urls: urlArr });
});

// Endpoint to retrieve quoteDetails
app.get('/get-details', (req, res) => {
    res.json({ details: quoteDetails });
});

// Endpoint to receive and store URLs
app.post('/open', async (req, res) => {
    const { url } = req.body;
    try {
        console.log('Received URL:', url);
        if (url !== undefined) {
            urlArr.push(url);
        }
        console.log("urlArr is", urlArr);
        res.send({ "url": url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/quoteDetails", async (req, res) => {
    const {
        id, description, Heighest_Cost, Internal_Currency_Unit_Price, isTaxable,
        Product_Name, Product_Type, Product_Id, quantity, Unit_Price
    } = req.body;

    try {
        console.log(
            id, description, Heighest_Cost, Internal_Currency_Unit_Price, isTaxable,
            Product_Name, Product_Type, Product_Id, quantity, Unit_Price
        );

        quoteDetails.id = id;
        quoteDetails.description = description;
        quoteDetails.Heighest_Cost = Heighest_Cost;
        quoteDetails.Internal_Currency_Unit_Price = Internal_Currency_Unit_Price;
        quoteDetails.isTaxable = isTaxable;
        quoteDetails.Product_Name = Product_Name;
        quoteDetails.Product_Type = Product_Type;
        quoteDetails.Product_Id = Product_Id;
        quoteDetails.quantity = quantity;
        quoteDetails.Unit_Price = Unit_Price;

        console.log(quoteDetails);
        res.json({
            id, description, Heighest_Cost, Internal_Currency_Unit_Price, isTaxable,
            Product_Name, Product_Type, Product_Id, quantity, Unit_Price
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/resource', async (req, res) => {
    const id = req.query.id;
    console.log('Received request for /resource');
    console.log('Query parameters:', req.query);

    if (id) {
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Quote Details</title>
                <style>
                    body {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        margin: 0;
                        font-family: Arial, sans-serif;
                        background: #f0f0f0;
                        color: #333;
                        padding: 20px;
                        box-sizing: border-box;
                    }
                    h1 {
                        text-align: center;
                        margin-top: 20px;
                        font-size: 2em;
                        color: #333;
                    }
                    .button {
                        background-color: #ff6600;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        margin-top: 20px;
                        transition: background-color 0.3s ease;
                    }
                    .button:hover {
                        background-color: #e65c00;
                    }
                    #result {
                        margin-top: 20px;
                    }
                    #loader {
                        display: block;
                        margin-top: 20px;
                        font-size: 18px;
                        font-weight: bold;
                        color: #ffcc00;
                        text-align: center;
                    }
                    #quote-details {
                        display: none;
                        margin-top: 20px;
                        border: 2px solid #ccc;
                        border-radius: 10px;
                        padding: 20px;
                        background: white;
                        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                        width: 100%;
                        max-width: 600px;
                    }
                    #quote-details p {
                        margin: 10px 0;
                        font-size: 1.1em;
                    }
                    #quote-details p span {
                        font-weight: bold;
                        color: #333;
                    }
                    .key-value-pair {
                        display: flex;
                        justify-content: space-between;
                        padding: 5px 0;
                    }
                    @media (max-width: 600px) {
                        h1 {
                            font-size: 1.5em;
                        }
                        .button {
                            font-size: 14px;
                            padding: 8px 16px;
                        }
                        #quote-details {
                            padding: 15px;
                        }
                        #quote-details p {
                            font-size: 1em;
                        }
                    }
                </style>
            </head>
            <body>
                <h1>Quote Details</h1>
                <div id="loader">Loading...</div>
                <div id="quote-details">
                    <div class="key-value-pair"><span>Description:</span> <span id="description"></span></div>
                    <div class="key-value-pair"><span>Highest Cost:</span> <span id="highest-cost"></span></div>
                    <div class="key-value-pair"><span>Internal Currency Unit Price:</span> <span id="internal-currency-unit-price"></span></div>
                    <div class="key-value-pair"><span>Is Taxable:</span> <span id="is-taxable"></span></div>
                    <div class="key-value-pair"><span>Product Name:</span> <span id="product-name"></span></div>
                    <div class="key-value-pair"><span>Product Type:</span> <span id="product-type"></span></div>
                    <div class="key-value-pair"><span>Product Id:</span> <span id="product-id"></span></div>
                    <div class="key-value-pair"><span>Quantity:</span> <span id="quantity"></span></div>
                    <div class="key-value-pair"><span>Unit Price:</span> <span id="unit-price"></span></div>
                </div>
                <div id="result" style="display: none;"></div>
                <script>
                    window.addEventListener('DOMContentLoaded', async () => {
                        try {
                            await fetch('https://testingautotsk.app.n8n.cloud/webhook/autotask', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ quoteId: '${id}' })
                            });
                            console.log('Quote ID sent to N8N server successfully');
                        } catch (error) {
                            console.error('Error sending quote ID to N8N:', error);
                        }

                        const storedUrls = localStorage.getItem('urlArr');
                        if (storedUrls) {
                            const urlArr = JSON.parse(storedUrls);
                            console.log('Loaded urlArr from local storage:', urlArr);
                        } else {
                            console.log('No urls in local storage.');
                        }

                        setTimeout(async () => {
                            try {
                                const detailsResponse = await fetch('https://newflow.vercel.app/get-details');
                                if (!detailsResponse.ok) {
                                    throw new Error('Failed to fetch details');
                                }

                                const detailsResult = await detailsResponse.json();
                                localStorage.setItem('details', JSON.stringify(detailsResult.details));
                                console.log('details saved to local storage:', detailsResult.details);

                                const details = detailsResult.details;

                                document.getElementById('description').textContent = details.description || 'N/A';
                                document.getElementById('highest-cost').textContent = details.Heighest_Cost || 'N/A';
                                document.getElementById('internal-currency-unit-price').textContent = details.Internal_Currency_Unit_Price || 'N/A';
                                document.getElementById('is-taxable').textContent = details.isTaxable || 'N/A';
                                document.getElementById('product-name').textContent = details.Product_Name || 'N/A';
                                document.getElementById('product-type').textContent = details.Product_Type || 'N/A';
                                document.getElementById('product-id').textContent = details.Product_Id || 'N/A';
                                document.getElementById('quantity').textContent = details.quantity || 'N/A';
                                document.getElementById('unit-price').textContent = details.Unit_Price || 'N/A';

                                document.getElementById('loader').style.display = 'none';
                                document.getElementById('quote-details').style.display = 'block';
                            } catch (error) {
                                console.error('Error fetching details:', error);
                            }
                        }, 6000);
                    });

                    setTimeout(() => {
                        const fetchButton = document.createElement('button');
                        fetchButton.innerText = 'Pay and Approve';
                        fetchButton.className = 'button';
                        fetchButton.addEventListener('click', async () => {
                            const loader = document.getElementById('loader');
                            const resultDiv = document.getElementById('result');

                            loader.style.display = 'block';
                            try {
                                const response = await fetch('https://newflow.vercel.app/open', {
                                    method: 'POST'
                                });

                                if (!response.ok) {
                                    throw new Error('Failed to fetch from /open');
                                }

                                const result = await response.json();
                                console.log('Response from /open:', result);

                                const urlsResponse = await fetch('https://newflow.vercel.app/get-urls');
                                if (!urlsResponse.ok) {
                                    throw new Error('Failed to fetch URL array');
                                }

                                const urlsResult = await urlsResponse.json();
                                const urlArr = urlsResult.urls;

                                localStorage.setItem('urlArr', JSON.stringify(urlArr));
                                console.log('urlArr saved to local storage:', urlArr);

                                urlArr.forEach(url => {
                                    window.open(url, '_blank');
                                });

                                resultDiv.innerHTML = '<h2>URLs received:</h2>';
                                for (const url of urlArr) {
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.target = '_blank';
                                    link.textContent = url;
                                    link.style.display = 'block';
                                    resultDiv.appendChild(link);
                                }
                                resultDiv.style.display = 'block';

                            } catch (error) {
                                console.error('Error fetching from /open:', error);
                                resultDiv.innerText = 'Failed to fetch from /open';
                                resultDiv.style.display = 'block';
                            } finally {
                                loader.style.display = 'none';
                            }
                        });

                        document.body.appendChild(fetchButton);
                    }, 10000);
                </script>
            </body>
            </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
    } else {
        res.send('No ID provided');
    }
});

let subssessionsId;
let nextDate;

app.post("/monthly", async (req, res) => {
    const STRIPE_KEY = "sk_test_51Nv0dVSHUS8UbeVicJZf3XZJf72DL9Fs3HP1rXnQzHtaXxMKXwWfua2zi8LQjmmboeNJc3odYs7cvT9Q5YIChY5I00Pocly1O1";
    const Stripe = stripe(STRIPE_KEY);
    const { custName, price, name } = req.body;
    const newPrice = Math.ceil(parseFloat(price));

    try {
        const customer = await Stripe.customers.create({ name: custName });
        const custId = customer.id;
        console.log("Customer ID:", custId);

        const newprice = await Stripe.prices.create({
            currency: 'inr',
            unit_amount: newPrice * 100,
            recurring: {
                interval: 'month',
            },
            product_data: {
                name: name,
            },
        });
        const priceId = newprice.id;

        const session = await Stripe.checkout.sessions.create({
            customer: custId,
            success_url: 'https://newflow.vercel.app/sendPaymentTicket',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
        });
        subssessionsId = session.id;
        nextDate = session.days_until_due;

        console.log("Subscription Session ID:", subssessionsId);
        res.status(200).json({ session, nextDate, subssessionsId });
    } catch (err) {
        console.error("Error in /monthly:", err);
        res.status(500).json({ err: err.message });
    }
});

app.post("/sendPaymentTicket", async (req, res) => {
    const {subssessionsId , nextDate} = req.body
    try {
        const payload = {
            subssessionsId,
            nextDate
        };
        const sendSubsId = await fetch('https://testingautotsk.app.n8n.cloud/webhook/createTicketForPayment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (sendSubsId.ok) {
            res.send("Ticket Created");
        } else {
            const errorText = await sendSubsId.text();
            console.error("Error from webhook:", errorText);
            res.status(sendSubsId.status).send("Please Contact Admin !!!");
        }
    } catch (err) {
        console.error("Error in /sendPaymentTicket:", err);
        res.status(500).send(err.message);
    }
});

app.listen(PORT, () => {
    console.log('Server is listening on PORT :' + PORT);
});
