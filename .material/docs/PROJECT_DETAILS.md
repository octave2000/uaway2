# UAWAY - Full Project Documentation

## Project Overview
**UAWAY** is a mobile-first ride-sharing application that can also be accessed via the web. It allows users to post journeys, enabling other users to book rides in available vehicles. Payments are securely handled within the system, and both drivers and clients have mechanisms for verification, reviews, and ride management.

The application ensures a smooth, secure, and user-friendly experience for both drivers and clients.

---

## Target Users
1. **Drivers**: Individuals offering rides using their personal vehicles.
2. **Clients**: Users seeking rides posted by drivers.

---

## Functionalities

### 1. User Account Management
- **Registration & Login**: Quick and easy process for both mobile and web users.
- **Verification**:
  - **Personal Account**: ID verification with selfie is mandatory for verified accounts.
  - **Car Verification**: Optional but recommended; drivers can upload vehicle documents.
- **Profile Management**: Users can update personal details and view verification status.

### 2. Vehicle Management (Drivers)
- Add and manage multiple cars with details:
  - Car name, plate number, photo
  - Default settings (origin, destination, seats, luggage capacity)
  - Upload necessary documents for car verification
- Drivers can confirm or override default car settings when posting a journey.

### 3. Journey Management
- **Posting Journeys**:
  - Choose a car and specify journey details: origin, destination, date/time, seats available, luggage capacity, price per seat.
  - Journey history stored for easy reposting.
- **Booking Journeys (Clients)**:
  - View all posted journeys.
  - Book a seat, select luggage space, pay via M-Pesa using Flutterwave (currency: KES).
  - Unique booking code generated for each client for ride completion verification.
- **Journey Lifecycle**:
  - Begin Ride: Initiated by client; driver must confirm.
  - End Ride: Initiated by driver; client must confirm.
  - Automatic ride completion after 24 hours if not ended manually.

### 4. Payment System
- Clients pay per booking; price is per seat.
- System charges a fixed booking fee (modifiable in future).
- Driver withdrawals allowed after 6 hours or immediately if clients approve advance payment request for ongoing rides.
- Refunds allowed with a small cancellation fee.

### 5. Ratings & Reviews
- Clients can rate drivers after ride completion.
- Drivers cannot rate themselves; clients provide feedback post-ride.

### 6. Security & Integrity
- Verification of personal accounts mandatory.
- Booking codes ensure ride integrity even if devices are offline.
- Ride cannot start without mutual initiation (client initiates start, driver confirms).
- Ride cannot end without mutual confirmation.
- Automatic end safeguards against forgotten confirmations.

---

## Pages / Screens

### 1. Home Page
- Display all active journeys.
- Quick view of journey details: car, driver, price, seats available, luggage.
- Option to register/login to book a ride.

### 2. User Account
- **Profile Overview**: Verification status, personal details.
- **My Journeys (Drivers)**: Active, history, repost options.
- **My Bookings (Clients)**: Upcoming rides, past rides, ratings submitted.

### 3. Vehicle Management (Drivers)
- Add new vehicle.
- Edit existing vehicle details.
- Upload car verification documents.

### 4. Journey Posting (Drivers)
- Select car.
- Input journey details.
- Confirm or override default car settings.

### 5. Journey Booking (Clients)
- Select journey.
- Choose seat(s) and luggage space.
- Make payment via integrated M-Pesa/Flutterwave.
- Receive booking code.

### 6. Ride Management
- **Begin Ride**: Client initiates; driver confirms.
- **End Ride**: Driver initiates; client confirms.
- **Automatic Ride Completion**: After 24 hours.
- **Advance Payment Requests**: Driver can request early payment from clients during ongoing rides.

### 7. Ratings & Reviews
- Post-ride feedback submission.
- Display driver ratings for future clients.

### 8. Payment Management
- Overview of client payments.
- Withdrawal request for drivers (after 6 hours or via advance approval).
- Cancellation/refund management.

---

## Sections / Modules

1. **Authentication & Verification Module**
   - Handles registration, login, ID verification, selfie verification.
2. **Vehicle Module**
   - Manages car addition, edits, and verification documents.
3. **Journey Module**
   - Posting journeys, journey lifecycle, history management.
4. **Booking Module**
   - Seat selection, luggage allocation, booking code generation.
5. **Payment Module**
   - Payment integration, fees, refunds, withdrawal management.
6. **Ride Control Module**
   - Begin/End ride sequences, mutual confirmations, automatic completion.
7. **Ratings & Feedback Module**
   - Collect and display driver ratings.
8. **Notifications Module**
   - Alerts for ride start/end, payments, advance payment requests.
9. **Admin Module (Optional Future)**
   - Manage fees, view transactions, handle disputes.

---

## System Rules & Constraints
- Booking price is per seat; no shared fare calculations.
- Ride initiation requires mutual confirmation (client starts, driver confirms).
- Ride ending requires mutual confirmation (driver initiates, client confirms).
- Automatic ride completion after 24 hours.
- Driver withdrawals restricted to 6 hours post-payment unless advance request is approved.
- Cancellation fees set by the system.

---

## Additional Notes / Improvements
- Include clear differentiation between personal and vehicle verification.
- Ensure mobile-first design while maintaining web compatibility.
- Provide intuitive notification system for real-time ride updates.
- Implement security measures for payment and ride integrity.
- Allow reposting of previous journeys for convenience.
- Enhance UI for easy ride initiation and completion sequences.
- Track and manage ride history for both drivers and clients.

---
