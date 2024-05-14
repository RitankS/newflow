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

app.post("/open", async (req, res) => {
    try {
        // Access the `url` property within `req.body`
        const url = req.body.url;
        if (!url) {
          return res.status(400).send('Missing URL parameter');
        }
        openURLInBrowser(url);
        res.send('URL opened successfully');
    }
    catch (err) {
        // Handle errors
        console.error(err);
        res.status(500).json({ error: err.message });
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

            const responseData = await response.json();
            console.log('Response from external service:', responseData);

            // Send response back to the client
            res.status(200).json({
                message: `Received ID: ${id}`,
                externalServiceResponse: responseData
            });
        } catch (error) {
            console.error('Error during fetch:', error);
            res.status(500).json({ error: 'Failed to send data to external service' });
        }
    } else {
        res.send('No ID provided');
    }
});

app.listen(PORT, () => {
    console.log('Server is listening on PORT :' + PORT);
});
