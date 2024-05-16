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


let quoteId;

app.get('/resource', async (req, res) => {
    const id = req.query.id;
    console.log('Received request for /resource');
    console.log('Query parameters:', req.query);

    if (id) {
        quoteId = id;

        // Render an HTML page with quoteId and a button
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Resource Page</title>
            </head>
            <body>
                <h1>Resource Details</h1>
                <p>quoteId: ${quoteId}</p>
                <button id="fetchButton">Fetch URL</button>
                <div id="loader" style="display: none;">Loading...</div>
                <div id="result" style="display: none;"></div>
                <script>
                    const fetchButton = document.getElementById('fetchButton');
                    const loader = document.getElementById('loader');
                    const resultDiv = document.getElementById('result');

                    fetchButton.addEventListener('click', async () => {
                        loader.style.display = 'block';
                        fetchButton.style.display = 'none';

                        try {
                            // Send quoteId to N8N server
                            await fetch('https://testingautotsk.app.n8n.cloud/webhook/autotask', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ quoteId: '${quoteId}' })
                            });

                            const response = await fetch('https://newflow.vercel.app/open', {
                                method: 'POST'
                            });

                            if (!response.ok) {
                                throw new Error('Failed to fetch from /open');
                            }

                            const result = await response.json();
                            console.log('Response from /open:', result);

                            resultDiv.innerText = 'Response received: ' + JSON.stringify(result);
                            resultDiv.style.display = 'block';
                        } catch (error) {
                            console.error('Error:', error);
                            resultDiv.innerText = 'Failed to fetch from /open';
                            resultDiv.style.display = 'block';
                        } finally {
                            loader.style.display = 'none';
                        }
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

app.post('/open', async (req, res) => {
    const { url } = req.body;
    try {
        console.log(url);
        
        // Simulate a delayed response (replace with your actual logic)
        await new Promise((resolve) => {
            // Simulate processing time
            setTimeout(() => {
                resolve();
            }, 5000); // Simulate processing time of 5 seconds
        });

        // Sending the URL back as a response
        res.status(200).json({ url });
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
