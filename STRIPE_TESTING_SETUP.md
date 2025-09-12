# 🧪 Stripe Testing Setup (No Domain Required)

This guide helps you test Stripe payments locally without needing a domain or webhooks.

## 📋 Quick Setup

### 1. Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (toggle in top left)
3. Go to **Developers** → **API keys**
4. Copy your **Publishable key** and **Secret key**

### 2. Create Products & Prices

1. Go to **Products** in Stripe Dashboard
2. Click **"+ Add product"**
3. Create two products:

**Monthly Plan:**
- Name: `DappDojo Monthly`
- Price: `$19.99`
- Billing: `Monthly`

**Yearly Plan:**
- Name: `DappDojo Yearly`  
- Price: `$199.99`
- Billing: `Yearly`

4. Copy the **Price IDs** (start with `price_`)

### 3. Environment Variables

Add to your `.env` file:

```bash
# Stripe Test Keys
STRIPE_PUBLISHABLE_KEY="pk_test_your_publishable_key_here"
STRIPE_SECRET_KEY="sk_test_your_secret_key_here"

# Stripe Price IDs
STRIPE_MONTHLY_PRICE_ID="price_your_monthly_price_id"
STRIPE_YEARLY_PRICE_ID="price_your_yearly_price_id"
```

### 4. Test Payment Flow

1. Start your app: `npm run dev`
2. Go to `/pricing`
3. Click on a paid plan
4. Use Stripe test card numbers:

## 💳 Test Card Numbers

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 9987` | Lost card |
| `4000 0000 0000 9979` | Stolen card |

**Use any future expiry date (e.g., 12/25) and any 3-digit CVC (e.g., 123)**

## 🔄 How It Works

1. **User clicks plan** → Redirected to Stripe Checkout
2. **User enters test card** → Payment processed by Stripe
3. **Success redirect** → User goes to `/courses?success=true&session_id=...`
4. **Auto-handling** → App automatically updates subscription status
5. **Access granted** → User can now access all courses

## 🚨 Important Notes

- **Always use Test mode** during development
- **No webhooks needed** for basic testing
- **Test cards only work** in Test mode
- **Real cards won't be charged** in Test mode

## 🐛 Troubleshooting

### "Invalid API Key"
- Make sure you're using **Test keys** (start with `pk_test_` and `sk_test_`)
- Check that keys are correctly added to `.env`

### "Price not found"
- Verify your Price IDs are correct
- Make sure products are created in **Test mode**

### "Payment not updating"
- Check browser console for errors
- Verify the success handler is being called
- Check database for updated subscription status

## 🚀 Next Steps

Once testing works locally:

1. **Get a domain** (Vercel, Netlify, etc.)
2. **Set up webhooks** for production
3. **Switch to Live mode** when ready
4. **Update environment variables** with Live keys

## 📞 Need Help?

- Check Stripe Dashboard for transaction logs
- Use browser dev tools to debug API calls
- Verify database updates in your admin panel
