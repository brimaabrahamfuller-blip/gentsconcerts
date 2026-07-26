# GentsConcerts - Changelog

## v2.0 - Major Enhancement Release

### Part 1: Dashboard Fixes
- **AdminScreen.js**: Rewrote with working navigation for Manage Users, All Events, Platform Stats, and Settings. All buttons now wire to real endpoints and screens.
- **AdminDashboardScreen.js**: Fixed Edit button to use real PUT endpoint (`/events/:id`), added loading states, improved error handling.
- **OwnerDashboardScreen.js**: Fixed event status filter mismatch (changed from `published` to `active` to match backend Event model), fixed flag dismiss action to use correct endpoint, added loading states.
- **ProfileScreen.js**: Fixed notification preference key mismatch (`promotions` -> `promotionalEmails` to match User model), added Edit Profile modal with image upload, added loading states, added verified email badge with resend option.
- **TicketsScreen.js**: Fixed retry payment endpoint URL (`/payments/retry` -> `/tickets/retry`), replaced non-functional download button with working Share button, added View Event Details button.

### Part 2: Logo Replacement
- **Logo.js**: Replaced SVG-based logo with the provided brand PNG image (`assets/logo.png`). Updated both the `Logo` default export and `HeaderLogo` export to use the new image asset.
- **SplashScreen.js**: Updated to display the new brand logo image with fade-in animation.
- **LoginScreen.js**: Already uses `Logo` component which now renders the PNG image.

### Part 3: Watermark and Page Animations
- **New Component: Watermark.js**: Reusable subtle brand watermark with fade-in animation, appearing at the bottom of every screen.
- **New Component: PageAnimation.js**: Reusable fade-in + slide-up entrance animation wrapper.
- **Updated Screens**: HomeScreen, EventsScreen, TicketsScreen, ProfileScreen, EventDetailScreen, HostEventScreen, AdminScreen, AdminDashboardScreen, OwnerDashboardScreen, PrivacyPolicyScreen, TermsAndConditionsScreen, EmailVerificationScreen - all now include watermark and page animation.

### Backend Fixes
- **adminController.js**: Fixed status filter from `published` to `active` to match Event model enum, fixed `totalPrice` to `totalAmountUSD`, fixed notification preference key from `promotions` to `promotionalEmails`.
