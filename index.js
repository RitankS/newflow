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

// Endpoint to render HTML page and fetch quote details after 10 seconds
app.get('/resource', async (req, res) => {
    const id = req.query.id;
    console.log('Received request for /resource');
    console.log('Query parameters:', req.query);

    let quoteId; // Define the quoteId variable here

    if (id) {
        quoteId = id;

        // Render an HTML page without quote details
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
                <div id="quote-details">
                    <p>Description: N/A</p>
                    <p>Heighest Cost: N/A</p>
                    <p>Internal Currency Unit Price: N/A</p>
                    <p>Is Taxable: N/A</p>
                    <p>Product Name: N/A</p>
                    <p>Product Type: N/A</p>
                    <p>Product Id: N/A</p>
                    <p>Quantity: N/A</p>
                    <p>Unit Price: N/A</p>
                </div>
                <div id="loader" style="display: none;">Loading...</div>
                <div id="result" style="display: none;"></div>
                <script>
                    setTimeout(() => {
                        document.getElementById('loader').style.display = 'none';
                        document.getElementById('result').style.display = 'block';
                    }, 10000); // 10 seconds delay

                    window.addEventListener('DOMContentLoaded', async () => {
                        // Fetch quote details after 10 seconds
                        setTimeout(async () => {
                            try {
                                const response = await fetch('https://your-server-address/quoteDetails', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ id: '${quoteId}' })
                                });

                                if (response.ok) {
                                    const quoteDetails = await response.json();
                                    document.getElementById('quote-details').innerHTML = '';
                                    for (const key in quoteDetails) {
                                        const p = document.createElement('p');
                                        p.textContent = \`\${key}: \${quoteDetails[key]}\`;
                                        document.getElementById('quote-details').appendChild(p);
                                    }
                                } else {
                                    console.error('Failed to fetch quote details');
                                }
                            } catch (error) {
                                console.error('Error fetching quote details:', error);
                            }
                        }, 10000); // 10 seconds delay
                    });
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
