# GentsConcerts Host Dashboard Guide & Navigation Manual
**Prepared by:** Brima Abraham Fuller (Lead Architect, GentsConcerts)  
**Target Audience:** Event Hosts, Planners, and Administrators  
**Platform URL:** [gentsconcerts.netlify.app](https://gentsconcerts.netlify.app/) [1]

---

## Overview of the Host Dashboard

The **Host Portal** (accessible via the user profile when logged in with a host-approved account, or directly through the automated routing system) is designed to give event organizers absolute control over their event listings, ticket tiers, promotional media, and attendee analytics. With recent updates, the host workflow has been streamlined to remove approval bottlenecks: hosts receive immediate access upon signup, and event publishing is fully automated, shifting administrative oversight to post-publication vetting and flag management [2].

---

## Core Features of the Host Portal

The Host Dashboard is structured around four primary operational pillars, ensuring event creators can manage their entire lifecycle from creation to gate scanning without friction.

| **Feature Section** | **Functionality & Capabilities** | **Workflow / Action** |
| :--- | :--- | :--- |
| **Event Management** | Create, view, edit, and cancel upcoming concert or festival listings. | Click **"Create Event"**, fill in event details (Title, Date, Venue, City), and set up ticket tiers. |
| **Media & Flyer Uploads** | 100% functional media upload pipeline for event promotional flyers and profile photos. | Select flyer images from device storage; durable storage ensures media persists across server redeploys. |
| **Ticket Tier Configuration** | Define multiple ticket categories (e.g., General, VIP, VVIP) with custom pricing and quantities. | Add tiers dynamically with unique names, non-negative prices, and whole-number capacities. |
| **Automated Publishing** | Events go live immediately upon creation, making them instantly visible in the public catalogue. | Hit **"Publish Event Now"** to push the event live to fans and attendees. |

---

## Step-by-Step Navigation Instructions for Hosts

### 1. Accessing the Platform & Signup
* Visit [gentsconcerts.netlify.app](https://gentsconcerts.netlify.app/) on any modern smartphone, tablet, or desktop browser [1].
* Click **"Sign Up"** and select **"Event Host"** as your account role. Fill in your full name, email, phone number, and secure password.
* Upon registration, your host account is instantly provisioned with host privileges, bypassing manual waiting queues [2].

### 2. Navigating to the Host Portal
* Once logged in, navigate to the **Profile** tab via the bottom navigation bar.
* If your role is set to host, you will see the **"Host Portal"** menu item with a subtitle of *"Manage your events and analytics"* [3].
* Tap **"Host Portal"** to open the administrative event management screen (`AdminDashboardScreen.js`) [4].

### 3. Creating and Publishing an Event
* Inside the Host Portal, tap the create/add button to open the event creation modal.
* Enter the event title, category, date, time, venue, city, and description.
* Upload your event flyer image (supported formats: JPG, PNG under 5MB).
* Configure your ticket tiers by specifying ticket names (e.g., *VIP Access*), prices in USD, and available quantities.
* Tap **"Publish Event Now"**. The event is instantly validated, saved to MongoDB, and published to the public events catalogue for fans to view and purchase tickets [2] [5].

---

## References

[1] GentsConcerts Platform. https://gentsconcerts.netlify.app/  
[2] GentsConcerts Backend Architecture & Automated Workflow Documentation. `backend/controllers/eventController.js`  
[3] GentsConcerts Mobile Frontend. `gentsconcerts-app/screens/ProfileScreen.js`  
[4] GentsConcerts Host Portal. `gentsconcerts-app/screens/AdminDashboardScreen.js`  
[5] GentsConcerts Data Models. `backend/models/Event.js`
