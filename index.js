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

// Endpoint to retrieve urlArr
app.get('/get-urls', (req, res) => {
    res.json({ urls: urlArr });
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

let quoteDetails = [];
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
        quoteDetails.push({
            id, description, Heighest_Cost, Internal_Currency_Unit_Price, isTaxable,
            Product_Name, Product_Type, Product_Id, quantity, Unit_Price
        });
        console.log("quoteDetails array is", quoteDetails);

        // Send the received data as a JSON response
        res.status(200).json({
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
        const quoteId = id;

        // Fetch quote details
        let quoteDetails = {};
        try {
            const response = await fetch('https://your-server-address/quoteDetails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id: quoteId })
            });

            if (response.ok) {
                quoteDetails = await response.json();
                // Store the quote details in local storage
                localStorage.setItem('quoteDetails', JSON.stringify(quoteDetails));
            } else {
                console.error('Failed to fetch quote details');
            }
        } catch (error) {
            console.error('Error fetching quote details:', error);
        }

        // Render an HTML page with quoteId and a button
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
                        margin: 0;
                        font-family: Arial, sans-serif;
                    }
                    h1 {
                        text-align: center;
                        text-decoration: underline;
                        margin-top: 20px;
                    }
                    .hidden {
                        display: none;
                    }
                    .button {
                        background-color: blue;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        margin-top: 20px;
                    }
                    .button:hover {
                        background-color: darkblue;
                    }
                    #quote-details {
                        margin-top: 20px;
                        text-align: left;
                    }
                </style>
            </head>
            <body>
                <h1>Quote Details</h1>
                <div id="quote-details" class="hidden">
                    <p>Description: <span id="description">N/A</span></p>
                    <p>Heighest Cost: <span id="heighest-cost">N/A</span></p>
                    <p>Internal Currency Unit Price: <span id="internal-currency-unit-price">N/A</span></p>
                    <p>Is Taxable: <span id="is-taxable">N/A</span></p>
                    <p>Product Name: <span id="product-name">N/A</span></p>
                    <p>Product Type: <span id="product-type">N/A</span></p>
                    <p>Product Id: <span id="product-id">N/A</span></p>
                    <p>Quantity: <span id="quantity">N/A</span></p>
                    <p>Unit Price: <span id="unit-price">N/A</span></p>
                </div>
                <div id="loader">Loading...</div>
                <div id="result" style="display: none;"></div>
                <script>
                    window.addEventListener('DOMContentLoaded', async () => {
                        try {
                            await fetch('https://testingautotsk.app.n8n.cloud/webhook/autotask', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ quoteId: '${quoteId}' })
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

                        setTimeout(() => {
                            const storedQuoteDetails = localStorage.getItem('quoteDetails');
                            if (storedQuoteDetails) {
                                const quoteDetails = JSON.parse(storedQuoteDetails);
                                document.getElementById('description').innerText = quoteDetails.description || 'N/A';
                                document.getElementById('heighest-cost').innerText = quoteDetails.Heighest_Cost || 'N/A';
                                document.getElementById('internal-currency-unit-price').innerText = quoteDetails.Internal_Currency_Unit_Price || 'N/A';
                                document.getElementById('is-taxable').innerText = quoteDetails.isTaxable || 'N/A';
                                document.getElementById('product-name').innerText = quoteDetails.Product_Name || 'N/A';
                                document.getElementById('product-type').innerText = quoteDetails.Product_Type || 'N/A';
                                document.getElementById('product-id').innerText = quoteDetails.Product_Id || 'N/A';
                                document.getElementById('quantity').innerText = quoteDetails.quantity || 'N/A';
                                document.getElementById('unit-price').innerText = quoteDetails.Unit_Price || 'N/A';
                            }
                            document.getElementById('quote-details').classList.remove('hidden');
                            document.getElementById('loader').style.display = 'none';
                        }, 8000); 
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
                                const response = await fetch('/open', {
                                    method: 'POST'
                                });

                                if (!response.ok) {
                                    throw new Error('Failed to fetch from /open');
                                }

                                const result = await response.json();
                                console.log('Response from /open:', result);

                                const urlsResponse = await fetch('/get-urls');
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
                    }, 15000); // 15 seconds delay
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




app.post("/monthly" , async(req,res)=>{
    const STRIPE_KEY = "sk_test_51Nv0dVSHUS8UbeVicJZf3XZJf72DL9Fs3HP1rXnQzHtaXxMKXwWfua2zi8LQjmmboeNJc3odYs7cvT9Q5YIChY5I00Pocly1O1";
    const Stripe = new stripe(STRIPE_KEY)
    const { custName, price, name } = req.body
    const newPrice = Math.ceil(parseFloat(price))
  
    try {
      const customer = await Stripe.customers.create({
        name: custName,
      });
      const custId = customer.id
      console.log(custId)
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
      const  priceId = newprice.id
      const session = await Stripe.checkout.sessions.create({
        customer: custId,
        success_url: 'http://localhost:3110/payments/sessionstatus',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
      });
      const subssessionsId = session.id
      const nextDate = session.days_until_due
      console.log(subssessionsId)
      res.status(200).json(({ session  , nextDate , subssessionsId}))
    }
    catch(err){
        res.status(500).json({err: err.message})
    }
})

app.listen(PORT, () => {
    console.log('Server is listening on PORT :' + PORT);
});
