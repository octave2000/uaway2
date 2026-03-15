# HubMail SDK

A TypeScript-friendly SDK for sending emails via the HubMail API.

## Installation

```bash
bun add hubmail
# or
npm install hubmail
```

## Usage

### 1. Set up your API key
The SDK will automatically look for `HUBMAIL_KEY` in your environment variables.

```bash
# .env
HUBMAIL_KEY=hm_your_api_key_here
```

### 2. Send an email

```typescript
import { HubMail } from "hubmail";

const hubmail = new HubMail();

try {
  const result = await hubmail.send({
    from: "you@hubmail.space",
    to: ["friend@example.com"],
    subject: "Hello from HubMail",
    text: "This is a test email.",
    html: "<b>This is a test email.</b>",
  });

  console.log("Email sent! ID:", result.id);
} catch (error) {
  console.error("Failed to send email:", error.message);
}
```

### Configuration Options

You can also pass configuration directly to the constructor:

```typescript
const hubmail = new HubMail({
  apiKey: "hm_custom_key",
});
```

## Features

- **TypeScript Friendly**: Full type support for all request and response structures.
- **Flexible Recipients**: Support for single or multiple recipients (To, CC, BCC).
- **Environment Driven**: Automatic detection of API keys from environment variables.
- **Bun Native**: Built for high performance with Bun and standard Web APIs.
