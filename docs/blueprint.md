# **App Name**: Ms. Cheesy POS

## Core Features:

- Product Management: Add, edit, and delete menu items with details such as name, price, category, and image URL. changes will be updated in Supabase.
- Order Screen: Fast item selection with custom quantity adjustments and an order summary view. Products data comes from Supabase.
- Checkout System: Accept cash or digital payments, calculate change, and record transactions in Supabase. The total will be computed automatically,
- Sales Tracking: Generate daily, weekly, and monthly sales reports based on Supabase transaction data. Allows download of the sales data in CSV or Excel formats.
- Offline Support: Store transactions locally when offline and automatically sync with Supabase once online using IndexedDB for transaction management.
- User Authentication: Admin/staff login system using Supabase Auth with role-based access control.
- Intelligent Product Suggestions: Uses AI tool to analyze past order data and customer preferences to recommend optimal product pairings. Use data in the database to help increase the order value

## Style Guidelines:

- Primary color: Cheddar Orange (#FFA500) to reflect the cheese theme.
- Background color: Creamy White (#FAF0E6), a desaturated and brighter hue to provide a soft backdrop.
- Accent color: Tomato Red (#FF6347) to draw attention to key actions and enhance visual interest.
- Body and headline font: 'PT Sans', a sans-serif font that combines a modern look with warmth for all text elements.
- Code font: 'Source Code Pro' for displaying code snippets.
- Use flat, line-based icons with rounded corners, filled with cheddar orange or tomato red for categories, menu items, and actions.
- Responsive grid layout optimized for tablets and laptops, with clear sections for product display, order summary, and checkout options.
- Subtle animations when adding items to order or confirming transactions for user feedback.