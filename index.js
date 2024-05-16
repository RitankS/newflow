import express from 'express';
import stripe from 'stripe';
import open from 'open';

const app = express();
const PORT = process.env.PORT || 8080;

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


app.get('/resource', async (req, res) => {
    const id = req.query.id;
    console.log('Received request for /resource');
    console.log('Query parameters:', req.query);

    if (id) {
        const payload = { quoteId: id };

        try {
            console.log('Sending POST request to external service with payload:', payload);

            const response = await fetch("https://testingautotsk.app.n8n.cloud/webhook/autotask", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.statusText}`);
            }

            const responseData = await response.json();
            console.log('Response from external service:', responseData);

            // Check if responseData contains the URL
            if (!responseData.url) {
                throw new Error('URL not found in the response');
            }

            // Store the URL on the server side for the /open endpoint to access later
            app.set('responseURL', responseData.url);

            // Render an HTML page with a loader and delayed API call
            const htmlContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Resource Page</title>
                    <style>
                        #loader {
                            border: 16px solid #f3f3f3;
                            border-radius: 50%;
                            border-top: 16px solid #3498db;
                            width: 120px;
                            height: 120px;
                            animation: spin 2s linear infinite;
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                </head>
                <body>
                    <div id="loader"></div>
                    <div id="status" style="display: none;">
                        <h1>Resource Details</h1>
                        <p>ID: ${id}</p>
                    </div>
                    <script>
                        document.addEventListener('DOMContentLoaded', async () => {
                            try {
                                // Show the resource details immediately
                                document.getElementById('status').style.display = 'block';

                                // Wait for 30 seconds
                                await new Promise(resolve => setTimeout(resolve, 30000));

                                // Trigger the /open API
                                const response = await fetch('https://newflow.vercel.app/open', {
                                    method: 'POST'
                                });

                                const result = await response.json();
                                console.log('Response from /open:', result);

                                // Save the URL in localStorage
                                if (result.url) {
                                    localStorage.setItem('resourceURL', result.url);
                                    document.getElementById('status').innerText += '\\nURL saved to local storage';
                                } else {
                                    document.getElementById('status').innerText += '\\nFailed to retrieve URL';
                                }

                                // Hide loader and show status
                                document.getElementById('loader').style.display = 'none';
                            } catch (error) {
                                console.error('Error:', error);
                                document.getElementById('status').innerText += '\\nFailed to process request';
                                document.getElementById('loader').style.display = 'none';
                            }
                        });
                    </script>
                </body>
                </html>
            `;

            res.setHeader('Content-Type', 'text/html');
            res.send(htmlContent);
        } catch (error) {
            console.error('Error during fetch:', error);
            res.status(500).send('Failed to process request');
        }
    } else {
        res.send('No ID provided');
    }
});

app.post('/open', async (req, res) => {
    try {
        const url = app.get('responseURL');
        console.log('Retrieved URL to open:', url);
        if (!url) {
            return res.status(400).send('No URL available to open');
        }
        res.status(200).json({ url: url });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
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
