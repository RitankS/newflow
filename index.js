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
        // Fetch quote details
       
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
                    <!-- Placeholder for quote details -->
                </div>
                <div id="loader">Loading...</div>
                <div id="result" style="display: none;"></div>
                <script>
                const fetchQuoteDetails = async () => {
                    try {
                        const response = await fetch('https://newflow.vercel.app/quoteDetails');
                        if (response.ok) {
                            quoteDetails = await response.json();
                            console.log("quoteDetails are", quoteDetails);
                            return quoteDetails;
                        } else {
                            console.error('Failed to fetch quote details');
                            return null;
                        }
                    } catch (error) {
                        console.error('Error fetching quote details:', error);
                        return null;
                    }
                };
        
                    window.addEventListener('DOMContentLoaded', async () => {
                        const quoteDetails = await fetchQuoteDetails();
                        if (quoteDetails) {
                            renderQuoteDetails(quoteDetails);
                        } else {
                            console.log('Quote details not available');
                        }
                    });

                    const renderQuoteDetails = (quoteData) => {
                        const quoteDetailsDiv = document.getElementById('quote-details');
                        quoteDetailsDiv.innerHTML = 
                            '<p>Description: ' + (quoteData.description || 'N/A') + '</p>' +
                            '<p>Heighest Cost: ' + (quoteData.Heighest_Cost || 'N/A') + '</p>' +
                            '<p>Internal Currency Unit Price: ' + (quoteData.Internal_Currency_Unit_Price || 'N/A') + '</p>' +
                            '<p>Is Taxable: ' + (quoteData.isTaxable || 'N/A') + '</p>' +
                            '<p>Product Name: ' + (quoteData.Product_Name || 'N/A') + '</p>' +
                            '<p>Product Type: ' + (quoteData.Product_Type || 'N/A') + '</p>' +
                            '<p>Product Id: ' + (quoteData.Product_Id || 'N/A') + '</p>' +
                            '<p>Quantity: ' + (quoteData.quantity || 'N/A') + '</p>' +
                            '<p>Unit Price: ' + (quoteData.Unit_Price || 'N/A') + '</p>';
                            document.getElementById('loader').style.display = 'none';
                            quoteDetailsDiv.classList.remove('hidden');
                            addPayAndApproveButton();
                        };
    
                        const addPayAndApproveButton = () => {
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
                        };
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
        
        app.get('/quoteDetails', (req, res) => {
        res.json(quoteDetails);
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
