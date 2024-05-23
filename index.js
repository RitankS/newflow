import express from 'express';
import stripe from 'stripe';
import open from 'open';
import cron from 'node-cron';

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

let cId;

// Endpoint to receive and store URLs
app.post('/open', async (req, res) => {
    const { url, companyId } = req.body;
    try {
        console.log('Received URL:', url);
        console.log('Received companyId:', companyId); // Log to verify companyId

        // Assign companyId to cId
        cId = companyId;
        console.log('Assigned cId:', cId); // Log to verify cId assignment

        if (url !== undefined) {
            urlArr.push(url);
        }
        console.log("urlArr is", urlArr);
        res.send({ "url": url, "cId": cId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});



let detailsArr = []
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
        

        detailsArr.push(description , quantity , Unit_Price , Product_Name , id)
        console.log("detailsArr is" , detailsArr)
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
                        justify-content: flex-start;
                        min-height: 100vh;
                        margin: 0;
                        font-family: Arial, sans-serif;
                        background: #FFFFFF;
                        color: #333;
                        padding: 20px;
                        box-sizing: border-box;
                    }
                    .header {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 20px;
                        width: 100%;
                        max-width: 600px;
                    }
                    h1 {
                        text-align: center;
                        font-size: 2em;
                        color: #333;
                        margin: 0;
                        flex: 1;
                        margin-left: -30px; /* Move the heading 10px to the left */
                    }
                    .logo {
                        margin-right: 10px;
                        height: 30px; /* Adjust the height as needed */
                        width: auto;  /* Maintain aspect ratio */
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
                        font-size: 18px;
                        font-weight: bold;
                        color: #ffcc00;
                        text-align: center;
                    }
                    #quote-details {
                        display: none;
                        border: 2px solid #ccc;
                        border-radius: 10px;
                        padding: 20px;
                        background: white;
                        box-shadow: 0 0 10px rgba(0, 0, 0,0.1);
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
                <div class="header">
                    <img src='https://upload.wikimedia.org/wikipedia/commons/8/8c/Bask-logo.jpg' alt="Logo" class="logo"/>
                    <h1>Quote Details</h1>
                </div>
                <div id="loader">Please Wait Loading Quote Details for you .......</div>
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

                        setTimeout(() => {
                            const fetchButton = document.createElement('button');
                            fetchButton.textContent = 'Approve and Pay';
                            fetchButton.className = 'button';
                            fetchButton.addEventListener('click', async () => {
                                try {
                                    const urlsResponse = await fetch('https://newflow.vercel.app/get-urls');
                                    if (!urlsResponse.ok) {
                                        throw new Error('Failed to fetch URLs');
                                    }

                                    const urlsResult = await urlsResponse.json();
                                    localStorage.setItem('urlArr', JSON.stringify(urlsResult.urls));
                                    console.log('urlArr saved to local storage:', urlsResult.urls);

                                    const resultElement = document.getElementById('result');
                                    resultElement.style.display = 'block';
                                    resultElement.textContent = 'Quote Approved & Payment Completed Successfully !!';

                                    urlsResult.urls.forEach(url => {
                                        window.open(url, '_blank');
                                    });
                                } catch (error) {
                                    console.error('Error fetching URLs:', error);
                                }
                            });
                            document.body.appendChild(fetchButton);
                        }, 10000);
                    });
                </script>
            </body>
            </html>
        `;

        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);
    } else {
        res.status(400).json({ error: 'Missing id parameter in query string' });
    }
});


app.get("/sendticket", async (req, res) => {
    try {
        // Simulate sending the ticket, replace with your actual sendTicket function
        await new Promise(resolve => setTimeout(resolve, 1000));
        await sendTicket()
        const htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Payment Success</title>
                <style>
                    body {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        font-family: Arial, sans-serif;
                        background-color: #f0f0f0;
                    }
                    .container {
                        text-align: center;
                    }
                    .success-icon {
                        font-size: 100px;
                        color: green;
                        animation: scale-up-down 2s ease-in-out infinite;
                    }
                    .message {
                        font-size: 24px;
                        color: #333;
                        margin-top: 20px;
                        opacity: 0;
                        animation: slide-up 1s forwards 2s; /* Starts after 2 seconds */
                    }
                    @keyframes scale-up-down {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.5); }
                    }
                    @keyframes slide-up {
                        0% { opacity: 0; transform: translateY(20px); }
                        100% { opacity: 1; transform: translateY(0); }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="success-icon">&#10004;</div>
                    <div class="message">Payment Successful</div>
                </div>
            </body>
            </html>
        `;

        res.send(htmlContent);
    } catch (err) {
        console.error("Error in /sendticket:", err);
        res.status(500).json({ err: err.message });
    }
});

// Function to send the /send API request
async function sendTicket() {
    const payload = {
        custId,
        cId,
        detailsArr
    };
    console.log("payload" ,payload)
    const sendSubsId = await fetch('https://testingautotsk.app.n8n.cloud/webhook/createTicketForPayment', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!sendSubsId.ok) {
        const errorText = await sendSubsId.text();
        throw new Error("Error from webhook: " + errorText);
    }
}

// Your existing /send API endpoint
app.post("/send", async (req, res) => {
    console.log("Received request at /sendPaymentTicket:", req.body);

    const { custId, nextDate } = req.body;
    try {
        await sendTicket(); // Call the sendTicket function

        res.send("Ticket Created");
    } catch (err) {
        console.error("Error in /sendPaymentTicket:", err);
        res.status(500).send(err.message);
    }
});

let subssessionsId;
let nextDate;

let custId
app.post("/pay", async (req, res) => {
    const STRIPE_KEY = "sk_test_51Nv0dVSHUS8UbeVicJZf3XZJf72DL9Fs3HP1rXnQzHtaXxMKXwWfua2zi8LQjmmboeNJc3odYs7cvT9Q5YIChY5I00Pocly1O1";
    const { price, name, custName, email } = req.body;
    const Stripe = new stripe(STRIPE_KEY);

    try {
        const newPrice = Math.ceil(parseFloat(price));

        const customer = await Stripe.customers.create({
            name: custName,
        });
        custId = customer.id
        const myPrice = await Stripe.prices.create({
            currency: 'INR',
            unit_amount: newPrice,
            product_data: {
                name: name,
            },
        });

        const priceId = myPrice.id;
        const session = await Stripe.checkout.sessions.create({
            success_url: 'https://newflow.vercel.app/sendticket',
            line_items: [
                {
                    price: priceId,
                    quantity: 10,
                },
            ],
            mode: 'payment',
        });
        res.status(200).json({ session, custId })
    }
    catch (err) {
        res.status(500).json(err.message)
    }
});


app.post("/monthly", async (req, res) => {
    const STRIPE_KEY = "sk_test_51Nv0dVSHUS8UbeVicJZf3XZJf72DL9Fs3HP1rXnQzHtaXxMKXwWfua2zi8LQjmmboeNJc3odYs7cvT9Q5YIChY5I00Pocly1O1";
    const Stripe = stripe(STRIPE_KEY);
    const { custName, price, name } = req.body;
    const newPrice = Math.ceil(parseFloat(price));

    try {
        const customer = await Stripe.customers.create({ name: custName });
        custId = customer.id;
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
            success_url: 'https://newflow.vercel.app/sendticket',
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

        console.log("Subscription Session ID:", custId);
        res.status(200).json({ session, nextDate, custId });
    } catch (err) {
        console.error("Error in /monthly:", err);
        res.status(500).json({ err: err.message });
    }
});

const header = {
    "ApiIntegrationCode": "BECBVKJQMKFAUNC27DM5QEAKY5B",
    "UserName": "eghhb5beqqpwase@bask.com",
    "Secret": "0x~QS*6aw9P@M#3p2b$Y#8EgJ",
    "Content-Type": "application/json"
  }
  



app.post("/createTicket" , async(req,res)=>{
    const {cId , description , desc , qunat , unit , id} = req.body
    try{
        const payload = {
            companyID : cId,
            dueDateTime: new Date(),
            priority: 1,
            status: 1,
            title: "Payment Completed",
            queueID: 5,
            description: `The payment for Quote ${id}is done , Stripe customer id is ${description} & the company Name is ${desc} , qunantity of product is ${qunat} & unit price is ${unit}`
          };
      
          const response = await fetch('https://webservices24.autotask.net/atservicesrest/v1.0/Tickets', {
            method: 'POST',
            headers:header,
            body: JSON.stringify(payload)
          });
      
          const responseData = await response.json();
          console.log(responseData);
          res.status(200).json(responseData)
    }
    catch(err){
        console.log(err)
        res.status(500).json(err)
    }
})

    
// handle cancellation through email

app.get("/ticketDetails", async(req, res) => {
    const id = req.query.id;
    console.log(id);
    const payload = {
        id: id
    }

    if(id){
        try{
            const response  = await fetch('https://testingautotsk.app.n8n.cloud/webhook/cancellation' , {
                method: "POST",
                headers: {
                    'Content-Type': "application/json"
                },
                body: JSON.stringify(payload)
            })
            if(response.ok){
                res.status(200).json({response , id})
            }
            else{
                res.status(502).json("Error Processing")
            }
        }
        catch(err){
            res.status(500).json({err})
        }
       
    }
});

app.get('/getsubscription/:ticketId', async (req, res) => {
    const ticketId = req.params.ticketId;
  
    try {
      const getTicketDetails = await fetch(`https://webservices24.autotask.net/atservicesrest/v1.0/tickets/${ticketId}`, {
        method: 'GET',
        headers: header
      });
  
      if (getTicketDetails.ok) {
        const result = await getTicketDetails.json();
        const description = result.item.description;
        res.status(200).json({ ticketId, description });
      } else {
        console.error(`Failed to fetch details for ticket ${ticketId}`);
        res.status(500).json({ error: `Failed to fetch details for ticket ${ticketId}` });
      }
    } catch (err) {
      console.error(`Error fetching details for ticket ${ticketId}:`, err);
      res.status(500).json({ error: err.message });
    }
  });


app.get('/getsubscription', async (req, res) => {
    const STRIPE_KEY = "sk_test_51Nv0dVSHUS8UbeVicJZf3XZJf72DL9Fs3HP1rXnQzHtaXxMKXwWfua2zi8LQjmmboeNJc3odYs7cvT9Q5YIChY5I00Pocly1O1";
    const Stripe = stripe(STRIPE_KEY);

    try {
        const custId = req.query.custId;  // Using query parameter instead of body
        console.log("The customer ID is", custId);
      
        const subscriptions = await Stripe.subscriptions.list({
            customer: custId,
            limit: 1,
        });
  
        if (subscriptions.data && subscriptions.data.length > 0) {

            res.status(200).json({ subscriptions });
        } else {
            res.status(404).json({ error: 'No subscriptions found for this customer.' });
        }
    } catch (err) {
        console.error("Error fetching subscription:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete("/cancelSubs", async (req, res) => {
    const STRIPE_KEY = "sk_test_51Nv0dVSHUS8UbeVicJZf3XZJf72DL9Fs3HP1rXnQzHtaXxMKXwWfua2zi8LQjmmboeNJc3odYs7cvT9Q5YIChY5I00Pocly1O1";
    const Stripe = stripe(STRIPE_KEY);
    const { subsId } = req.body;
    try {
        const subscription = await Stripe.subscriptions.cancel(subsId);
        res.status(200).json(subscription);
    } catch (err) {
        console.error("Error cancelling subscription:", err);
        res.status(500).json({ error: err.message });
    }
});


app.put("/cancellationUpdate" , async(req,res)=>{
    const {cancellationDetails} = req.body
    try{
        const payload = {
            cancellationDetails: cancellationDetails
        }
        const createTicketNoteResponse = await fetch('https://newflow.vercel.app/createTicketNote', {
              method: 'PUT',
             headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            });
            if(createTicketNoteResponse.ok){
                const data = await createTicketNoteResponse.json()
                res.status(200).json(data)
            }
            else{
                res.status(502).json("Error Generating ticket response")
            }
    }
    catch(err){
        res.status(500).json(err)
    }
})

// Send the response data to /createTicketNote endpoint
        // const createTicketNoteResponse = await fetch('https://newflow.vercel.app/createTicketNote', {
        //   method: 'PUT',
        //   headers: {
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify({ ticketId: req.body.ticketId, subscription })
        // });
  
        // const createTicketNoteResult = await createTicketNoteResponse.json();


app.listen(PORT, () => {
    console.log('Server is listening on PORT :' + PORT);
});






// custId->ticket update->new ticket with custId -> cron at 12 hr ->process ticket description -> read custID ->send to stripe -> get subscription -> process subscription details - > send this to stripe for cancellation - > update autotask ticket with subscription cancellation ID.