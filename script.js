const createPi = document.querySelector('#create-pi');
const capturePayment = document.querySelector('#capture-payment');
const refundPayment = document.querySelector('#refund-payment');
const form = document.getElementById('payment-form');

// endpoint
const endpoint = 'http://localhost:3000/.netlify/functions/api';

// state
let paymentIntentClientSecret;
let paymentIntentId;
let card;

// stripe
var stripe = Stripe(config.pk_stripe);
var elements = stripe.elements();

// create payment intents
createPi.addEventListener('click', async (e) => {
	const container = createPi.parentElement;
	const small = container.querySelector('small');
	try {
		const paymentIntent = await fetch(`${endpoint}/pi-demo`);
		const res = await paymentIntent.json();
		paymentIntentClientSecret = res.client_secret;
		paymentIntentId = res.id;
		small.textContent = paymentIntentId;
	} catch (error) {
		small.textContent = error;
	}
});

// when document has loaded create instance of elements
window.addEventListener('load', (e) => {
	// Set up Stripe.js and Elements to use in checkout form
	var style = {
		base: {
			color: '#32325d',
		},
	};

	card = elements.create('card', { style: style });
	card.mount('#card-element');

	card.on('change', ({ error }) => {
		const displayError = document.getElementById('card-errors');
		if (error) {
			displayError.textContent = error.message;
		} else {
			displayError.textContent = '';
		}
	});
});

// submit payment
form.addEventListener('submit', function (ev) {
	ev.preventDefault();
	stripe
		.confirmCardPayment(paymentIntentClientSecret, {
			payment_method: {
				card: card,
				billing_details: {
					name: 'Jenny Rosen',
				},
			},
		})
		.then(function (result) {
			if (result.error) {
				// Show error to your customer (e.g., insufficient funds)
				console.log(result.error.message);
			} else {
				// The payment has been processed!
				if (result.paymentIntent.status === 'requires_capture') {
					form.parentElement.querySelector(
						'small'
					).textContent = `Payment intent status: ${result.paymentIntent.status}`;
				}
			}
		});
});

// capture payment
capturePayment.addEventListener('click', async () => {
	try {
		const response = await fetch(`${endpoint}/pi-demo-capture`, {
			method: 'post',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ paymentIntentId }),
		});
		const res = await response.json();
		const chargeId = res.charges.data[0].id;
		capturePayment.parentElement.querySelector('small').textContent = chargeId;
	} catch (error) {
		console.log(error);
	}
});

// partial refund payment
refundPayment.addEventListener('click', async () => {
	try {
		const response = await fetch(`${endpoint}/refund`, {
			method: 'post',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ paymentIntentId }),
		});
		const res = await response.json();
		console.log(res);
		refundPayment.parentElement.querySelector(
			'small'
		).textContent = `Refund of ${res.amount / 100} ${res.currency} ${
			res.status
		}`;
	} catch (error) {
		console.log(error);
	}
});
