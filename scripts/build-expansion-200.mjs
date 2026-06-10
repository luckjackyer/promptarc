import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "content-pipeline");
const batches = [
  {
    name: "priority-batch-05",
    items: [
      ["expansion-luxury-watch-product-shot", "Luxury Watch Product Shot", "product", ["watch", "luxury", "product hero"], "Create a premium product hero image for an unbranded stainless steel wristwatch on dark stone, precise rim lighting, soft reflection, copy-safe negative space, and editorial luxury mood. No logos, no readable brand marks, no duplicate watches.", "1:1"],
      ["expansion-smart-water-bottle-hero", "Smart Water Bottle Hero", "product", ["bottle", "tech", "wellness"], "Create a clean ecommerce product shot for an unbranded smart water bottle with subtle LED hydration ring, fresh condensation, pale blue background, and clear hero composition. No logo, no text artifacts, no extra bottles.", "1:1"],
      ["expansion-organic-tea-packaging-flatlay", "Organic Tea Packaging Flat Lay", "product", ["tea", "packaging", "flat lay"], "Create an overhead product flat lay for unbranded organic tea packaging with loose leaves, ceramic cup, linen texture, warm daylight, and calm ecommerce styling. No logos, no readable fake text, no clutter.", "1:1"],
      ["expansion-minimal-sneaker-launch-ad", "Minimal Sneaker Launch Ad", "product", ["sneaker", "launch", "footwear"], "Create a minimalist product launch visual for an unbranded white sneaker on a soft shadow pedestal, clean geometric backdrop, premium studio lighting, and headline-safe negative space. No logos, no duplicate shoes, no text.", "4:5"],
      ["expansion-desk-lamp-product-scene", "Desk Lamp Product Scene", "product", ["desk lamp", "home office", "lighting"], "Create a warm lifestyle product shot for an unbranded modern desk lamp on a walnut desk, evening glow, tidy workspace props, and realistic soft shadows. No logos, no readable screens, no messy cables.", "3:2"],
      ["expansion-artisan-chocolate-box-hero", "Artisan Chocolate Box Hero", "product", ["chocolate", "gift", "premium"], "Create a premium ecommerce hero image for an unbranded artisan chocolate gift box, open lid, textured paper, a few cocoa pieces, warm editorial light, and refined composition. No logos, no readable text, no extra packaging.", "1:1"],
      ["expansion-yoga-mat-product-hero", "Yoga Mat Product Hero", "product", ["yoga", "wellness", "product hero"], "Create a clean product hero image for an unbranded rolled yoga mat with cork block and soft towel, neutral studio background, calm wellness mood, and copy-safe space. No logos, no people, no text.", "4:5"],
      ["expansion-travel-tumbler-camping-shot", "Travel Tumbler Camping Shot", "product", ["tumbler", "travel", "outdoor"], "Create a realistic outdoor product shot of an unbranded insulated travel tumbler on a camping table at sunrise, soft steam, pine background blur, and natural editorial styling. No logos, no readable text, no extra cups.", "3:2"],
      ["expansion-modular-sofa-lifestyle-ad", "Modular Sofa Lifestyle Ad", "product", ["sofa", "interior", "lifestyle"], "Create a lifestyle furniture ad image for an unbranded modular sofa in a bright apartment, clean lines, warm wood floor, soft daylight, and magazine-ready composition. No logos, no people, no distorted furniture.", "3:2"],
      ["expansion-premium-notebook-stationery-hero", "Premium Notebook Stationery Hero", "product", ["notebook", "stationery", "flat lay"], "Create a premium stationery flat lay with an unbranded linen notebook, fountain pen, paper clips, soft window light, and refined workspace styling. No logos, no readable text, no clutter.", "1:1"],
      ["expansion-music-festival-poster", "Music Festival Poster", "poster", ["music", "festival", "event poster"], "Create a vertical music festival poster visual with abstract stage lights, crowd silhouettes, dynamic color beams, strong central composition, and clean title/date-safe zones. No real text, no logos, no celebrity faces.", "4:5"],
      ["expansion-farmers-market-poster", "Farmers Market Poster", "poster", ["farmers market", "community", "event"], "Create a cheerful vertical farmers market poster visual with produce baskets, morning sunlight, friendly community mood, and clear blank zones for title and date. No readable text, no logos, no crowded layout.", "4:5"],
      ["expansion-design-conference-poster", "Design Conference Poster", "poster", ["conference", "design", "poster"], "Create a modern design conference poster visual with layered geometric forms, editorial grid, bold focal shape, and clean typography-safe areas. No readable fake text, no logos, no copied brand style.", "4:5"],
      ["expansion-museum-night-poster", "Museum Night Poster", "poster", ["museum", "night", "culture"], "Create a vertical museum night event poster visual with dramatic gallery lighting, sculpture silhouette, deep blue palette, and elegant blank zones for event details. No logos, no readable text, no people close-ups.", "4:5"],
      ["expansion-coffee-workshop-poster", "Coffee Workshop Poster", "poster", ["coffee", "workshop", "event"], "Create a warm vertical coffee brewing workshop poster visual with pour-over tools, steam, beans, tactile paper texture, and clean title-safe space. No brand logos, no readable fake text, no clutter.", "4:5"],
      ["expansion-indie-game-launch-poster", "Indie Game Launch Poster", "poster", ["game", "launch", "poster"], "Create a poster visual for an original indie game launch using playful low-poly landscapes, glowing portal, adventurous mood, and clear headline-safe areas. No existing characters, no logos, no readable text.", "4:5"],
      ["expansion-mental-health-campaign-poster", "Mental Health Campaign Poster", "poster", ["mental health", "campaign", "wellness"], "Create a gentle public campaign poster visual about mental wellness using calm abstract shapes, soft gradients, supportive mood, and clean message-safe whitespace. No medical claims, no readable text, no logos.", "4:5"],
      ["expansion-cycling-club-poster", "Cycling Club Poster", "poster", ["cycling", "club", "event"], "Create a vertical cycling club ride poster visual with sunrise road, motion blur wheels, energetic composition, and clean blank zones for route and date. No logos, no readable text, no unsafe traffic scene.", "4:5"],
      ["expansion-ceramic-class-poster", "Ceramic Class Poster", "poster", ["ceramics", "class", "workshop"], "Create a warm ceramic class poster visual with hands shaping clay, pottery tools, soft studio light, textured paper feel, and headline-safe space. No logos, no readable fake text, no distorted hands.", "4:5"],
      ["expansion-book-fair-poster", "Book Fair Poster", "poster", ["book fair", "literary", "event"], "Create a cozy vertical book fair poster visual with stacked books, paper texture, warm reading lamp, community atmosphere, and clean title/date zones. No logos, no readable fake titles, no clutter.", "4:5"]
    ]
  },
  {
    name: "priority-batch-06",
    items: [
      ["expansion-ai-writing-app-dashboard", "AI Writing App Dashboard", "ui", ["AI writing", "dashboard", "web UI"], "Create a polished web dashboard UI mockup for an AI writing assistant, left sidebar, prompt editor, document preview, usage cards, clean SaaS spacing, and realistic hierarchy. No tiny unreadable text, no real brand logos.", "3:2"],
      ["expansion-restaurant-reservation-app-ui", "Restaurant Reservation App UI", "ui", ["restaurant", "mobile UI", "booking"], "Create a mobile app UI mockup for restaurant reservations with date picker, table options, featured restaurant card, clear primary CTA, and warm hospitality styling. No unreadable microtext, no logos.", "4:5"],
      ["expansion-language-learning-app-ui", "Language Learning App UI", "ui", ["language", "mobile UI", "education"], "Create a mobile language learning app UI with lesson path, vocabulary cards, speaking practice module, friendly progress indicators, and clean hierarchy. No dense tiny text, no brand logos.", "4:5"],
      ["expansion-real-estate-search-app-ui", "Real Estate Search App UI", "ui", ["real estate", "mobile UI", "search"], "Create a mobile real estate search app UI with map preview, property cards, filter chips, saved homes, and premium but practical interface spacing. No real addresses, no logos, no unreadable small text.", "4:5"],
      ["expansion-project-management-kanban-ui", "Project Management Kanban UI", "ui", ["project management", "kanban", "web UI"], "Create a web app UI mockup for project management with kanban board, task detail panel, team avatars, timeline metric cards, and clear product hierarchy. No real brand names, no dense text.", "3:2"],
      ["expansion-meditation-app-onboarding-ui", "Meditation App Onboarding UI", "ui", ["meditation", "onboarding", "mobile UI"], "Create a calming mobile onboarding UI for a meditation app with soft illustration area, habit goal selector, breathing timer preview, and one clear CTA. No logos, no unreadable text.", "4:5"],
      ["expansion-creator-analytics-dashboard", "Creator Analytics Dashboard", "ui", ["creator", "analytics", "dashboard"], "Create a creator analytics dashboard UI with revenue cards, content performance chart, audience segments, clean navigation, and modern product screenshot polish. No real platform logos, no tiny text.", "3:2"],
      ["expansion-grocery-delivery-app-ui", "Grocery Delivery App UI", "ui", ["grocery", "mobile UI", "ecommerce"], "Create a mobile grocery delivery UI with category chips, cart summary, fresh produce cards, delivery time selector, and friendly commercial polish. No logos, no unreadable text, no clutter.", "4:5"],
      ["expansion-customer-support-inbox-ui", "Customer Support Inbox UI", "ui", ["support", "inbox", "SaaS"], "Create a SaaS customer support inbox UI with ticket list, conversation pane, AI reply suggestion card, status filters, and clear spacing. No real names, no brand logos, no tiny text.", "3:2"],
      ["expansion-weather-travel-planner-ui", "Weather Travel Planner UI", "ui", ["weather", "travel", "mobile UI"], "Create a mobile weather travel planner UI with destination cards, forecast timeline, packing suggestions, and one clear trip planning CTA. No real brand, no dense tiny text.", "4:5"],
      ["expansion-startup-funding-infographic", "Startup Funding Infographic", "infographic", ["startup", "funding", "roadmap"], "Create a vertical startup funding roadmap infographic with stages from idea to seed, milestone cards, investor readiness checklist, and clean icons. No tiny unreadable text, no logos, no financial promises.", "4:5"],
      ["expansion-skincare-routine-infographic", "Skincare Routine Infographic", "infographic", ["skincare", "routine", "beauty"], "Create a vertical skincare routine infographic with morning/evening steps, product order, timing cues, and clean beauty editorial styling. No medical claims, no brand logos, no dense text.", "4:5"],
      ["expansion-home-workout-infographic", "Home Workout Infographic", "infographic", ["fitness", "workout", "guide"], "Create a home workout infographic with warm-up, circuit blocks, rest intervals, form reminders, and readable modular layout. No medical claims, no tiny text, no unrealistic anatomy.", "4:5"],
      ["expansion-remote-team-workflow-infographic", "Remote Team Workflow Infographic", "infographic", ["remote work", "workflow", "team"], "Create a remote team workflow infographic showing async updates, decision log, meeting rhythm, and handoff process with clean icons and structured sections. No logos, no dense text.", "4:5"],
      ["expansion-podcast-production-infographic", "Podcast Production Infographic", "infographic", ["podcast", "production", "workflow"], "Create a podcast production workflow infographic with planning, recording, editing, publishing, repurposing, and metrics blocks. Use readable hierarchy and friendly icons. No logos, no tiny text.", "4:5"],
      ["expansion-meal-prep-budget-infographic", "Meal Prep Budget Infographic", "infographic", ["meal prep", "budget", "guide"], "Create a meal prep budget infographic with grocery categories, batch cooking timeline, storage tips, and cost-saving checklist. Clean food editorial style, no tiny text, no brand names.", "4:5"],
      ["expansion-cybersecurity-basics-infographic", "Cybersecurity Basics Infographic", "infographic", ["cybersecurity", "education", "checklist"], "Create a cybersecurity basics infographic with password manager, MFA, updates, phishing checks, backup routine, and clear icon modules. No fearmongering, no logos, no dense text.", "4:5"],
      ["expansion-solar-home-setup-infographic", "Solar Home Setup Infographic", "infographic", ["solar", "home", "energy"], "Create a home solar setup infographic showing panels, inverter, battery, grid connection, and usage flow with clean diagram style. No misleading savings claims, no tiny text, no logos.", "4:5"],
      ["expansion-content-repurposing-infographic", "Content Repurposing Infographic", "infographic", ["creator", "content", "workflow"], "Create a content repurposing infographic showing one long video turning into clips, newsletter, carousel, blog, and social posts. Use modular arrows, clear hierarchy, no tiny text.", "4:5"],
      ["expansion-morning-focus-routine-infographic", "Morning Focus Routine Infographic", "infographic", ["morning routine", "focus", "wellness"], "Create a morning focus routine infographic with wake-up, hydration, planning, deep work block, break timing, and calm productivity style. No medical claims, no dense text.", "4:5"]
    ]
  }
];

const moreItems = [
  ["expansion-street-food-documentary-photo", "Street Food Documentary Photo", "photography", ["street food", "documentary", "night"], "Create a realistic documentary-style street food photo at night with steam, warm vendor lights, shallow depth of field, candid atmosphere, and natural imperfections. No brand logos, no readable signs, no staged commercial look.", "3:2"],
  ["expansion-desert-road-trip-photo", "Desert Road Trip Photo", "photography", ["desert", "travel", "editorial"], "Create an editorial travel photo of a quiet desert road trip stop, dusty car silhouette, golden hour light, distant hills, and authentic film texture. No logos, no license plates, no people close-ups.", "3:2"],
  ["expansion-artist-studio-documentary-photo", "Artist Studio Documentary Photo", "photography", ["artist studio", "documentary", "creative"], "Create a realistic documentary photo inside an artist studio with paint marks, worktable clutter, soft side window light, and candid creative atmosphere. No readable posters, no logos, no staged perfection.", "3:2"],
  ["expansion-rooftop-garden-editorial-photo", "Rooftop Garden Editorial Photo", "photography", ["rooftop", "garden", "editorial"], "Create an editorial lifestyle photo of a rooftop garden in late afternoon, planters, city skyline blur, warm natural light, and calm sustainable living mood. No logos, no people close-ups, no text.", "3:2"],
  ["expansion-small-bakery-morning-photo", "Small Bakery Morning Photo", "photography", ["bakery", "morning", "documentary"], "Create a realistic morning bakery documentary photo with trays of bread, flour dust, warm window light, and subtle human activity without identifiable faces. No logos, no readable menus, no fake text.", "3:2"],
  ["expansion-rainy-bus-stop-photo", "Rainy Bus Stop Photo", "photography", ["rain", "commute", "documentary"], "Create a cinematic rainy bus stop photo with reflections, umbrellas, muted city lights, natural candid framing, and film grain. No readable ads, no logos, no recognizable faces.", "3:2"],
  ["expansion-vintage-camera-flatlay-photo", "Vintage Camera Flat Lay Photo", "photography", ["camera", "flat lay", "editorial"], "Create an editorial flat lay photo of a vintage camera, film rolls, contact sheets, textured desk surface, and soft daylight. No brand marks, no readable labels, no clutter.", "1:1"],
  ["expansion-coastal-fisherman-documentary-photo", "Coastal Fisherman Documentary Photo", "photography", ["coastal", "fisherman", "documentary"], "Create a respectful documentary photo of a small coastal fishing dock at dawn, nets, boats, mist, and natural working atmosphere. No readable boat names, no logos, no close-up identifiable face.", "3:2"],
  ["expansion-record-store-editorial-photo", "Record Store Editorial Photo", "photography", ["record store", "editorial", "music"], "Create an editorial photo inside a cozy record store with vinyl bins, warm practical lights, shallow depth of field, and nostalgic texture. No readable album covers, no logos, no people close-ups.", "3:2"],
  ["expansion-handmade-paper-workshop-photo", "Handmade Paper Workshop Photo", "photography", ["paper", "workshop", "documentary"], "Create a documentary-style photo of a handmade paper workshop with wet pulp trays, textured sheets drying, soft natural light, and tactile craft atmosphere. No logos, no readable labels, no staged perfection.", "3:2"],
  ["expansion-founder-office-portrait", "Founder Office Portrait", "portrait", ["founder", "office", "editorial"], "Create an editorial portrait of an original startup founder in a small office, natural window light, relaxed confident expression, laptop blurred in foreground, and realistic skin texture. No celebrity resemblance, no logos, no artificial smoothing.", "4:5"],
  ["expansion-chef-kitchen-portrait", "Chef Kitchen Portrait", "portrait", ["chef", "kitchen", "editorial"], "Create an editorial portrait of an original chef in a quiet kitchen before service, soft steam, stainless background, natural confident posture, and realistic skin detail. No celebrity resemblance, no logos, no distorted hands.", "4:5"],
  ["expansion-ceramic-artist-portrait", "Ceramic Artist Portrait", "portrait", ["ceramic artist", "studio", "portrait"], "Create an editorial portrait of an original ceramic artist in a clay studio, hands lightly dusted with clay, soft window light, calm expression, and authentic craft environment. No celebrity resemblance, no logos, no extra fingers.", "4:5"],
  ["expansion-urban-runner-portrait", "Urban Runner Portrait", "portrait", ["runner", "urban", "sport"], "Create a cinematic portrait of an original urban runner after sunrise training, city bridge background, soft sweat realism, confident expression, and natural athletic styling. No brand logos, no celebrity resemblance, no distorted limbs.", "4:5"],
  ["expansion-science-teacher-portrait", "Science Teacher Portrait", "portrait", ["teacher", "science", "classroom"], "Create a warm editorial portrait of an original science teacher in a classroom lab, soft practical light, simple experiment props, approachable expression, and realistic skin texture. No logos, no readable text, no celebrity resemblance.", "4:5"],
  ["expansion-florist-shop-portrait", "Florist Shop Portrait", "portrait", ["florist", "shop", "editorial"], "Create an editorial portrait of an original florist in a small flower shop, natural window light, layered flowers, gentle expression, and magazine-style framing. No logos, no readable signs, no celebrity resemblance.", "4:5"],
  ["expansion-cyclist-rain-portrait", "Cyclist Rain Portrait", "portrait", ["cyclist", "rain", "cinematic"], "Create a cinematic portrait of an original cyclist after a rainy ride, wet jacket texture, city reflections, moody light, and realistic face detail. No brand logos, no celebrity resemblance, no distorted bicycle parts.", "4:5"],
  ["expansion-architect-site-portrait", "Architect Site Portrait", "portrait", ["architect", "site", "editorial"], "Create an editorial portrait of an original architect on a quiet construction site, rolled plans, hardhat held naturally, soft overcast light, and confident posture. No logos, no readable plans, no celebrity resemblance.", "4:5"],
  ["expansion-musician-studio-portrait", "Musician Studio Portrait", "portrait", ["musician", "studio", "editorial"], "Create an editorial portrait of an original independent musician in a recording studio, warm low light, instruments blurred, thoughtful expression, and natural skin texture. No logos, no readable album art, no celebrity resemblance.", "4:5"],
  ["expansion-gardener-greenhouse-portrait", "Gardener Greenhouse Portrait", "portrait", ["gardener", "greenhouse", "portrait"], "Create a warm portrait of an original gardener in a greenhouse, leafy depth, soft humid light, natural expression, and tactile workwear texture. No logos, no celebrity resemblance, no extra fingers.", "4:5"]
];

const finalItems = [
  ["expansion-origami-lettering-artwork", "Origami Lettering Artwork", "typography", ["origami", "lettering", "paper"], "Create a typography artwork made from folded origami-style paper letterforms, crisp shadows, clean editorial composition, and soft pastel background. No logo imitation, no unreadable letters, no brand names.", "4:5"],
  ["expansion-liquid-metal-type-poster", "Liquid Metal Type Poster", "typography", ["liquid metal", "type", "poster"], "Create a typography-first poster with liquid metal letterforms, dramatic studio reflections, black background, and premium editorial layout. No copied logos, no unreadable gibberish, no brand names.", "4:5"],
  ["expansion-neon-window-lettering", "Neon Window Lettering", "typography", ["neon", "window", "lettering"], "Create a moody typography artwork using original neon lettering on a rainy window, colorful reflections, cinematic atmosphere, and clear letter silhouette. No real brand names, no copied signs, no unreadable clutter.", "4:5"],
  ["expansion-woodblock-type-artwork", "Woodblock Type Artwork", "typography", ["woodblock", "print", "lettering"], "Create a typography artwork inspired by woodblock print texture, bold carved letterforms, imperfect ink edges, and balanced negative space. No copied cultural symbols, no logos, no unreadable letters.", "4:5"],
  ["expansion-embroidered-lettering-layout", "Embroidered Lettering Layout", "typography", ["embroidery", "fabric", "lettering"], "Create editorial lettering made from embroidery thread on textured fabric, visible stitch detail, soft natural light, and clean magazine layout. No logos, no brand names, no unreadable clutter.", "4:5"],
  ["expansion-ice-lettering-artwork", "Ice Lettering Artwork", "typography", ["ice", "lettering", "minimal"], "Create a minimal typography artwork with translucent ice letterforms, frosty texture, cool blue light, and high-end editorial composition. No logos, no fake brand names, no messy background.", "4:5"],
  ["expansion-clay-lettering-still-life", "Clay Lettering Still Life", "typography", ["clay", "lettering", "still life"], "Create a playful clay lettering still life with rounded handmade letters, soft shadows, muted colors, and clean tabletop composition. No logos, no unreadable letters, no crowded props.", "4:5"],
  ["expansion-architectural-type-composition", "Architectural Type Composition", "typography", ["architecture", "type", "editorial"], "Create a typography-led composition where original letterforms are built from architectural columns and arches, refined editorial spacing, and neutral stone texture. No logos, no copied landmarks, no unreadable text.", "4:5"],
  ["expansion-watercolor-lettering-piece", "Watercolor Lettering Piece", "typography", ["watercolor", "lettering", "soft"], "Create a soft watercolor lettering artwork with translucent washes, gentle paper grain, balanced composition, and clear original letter shapes. No logos, no brand names, no muddy colors.", "4:5"],
  ["expansion-retro-computer-type-art", "Retro Computer Type Art", "typography", ["retro", "computer", "type"], "Create typography artwork inspired by original retro computer interface aesthetics, pixel glow, grid rhythm, and editorial poster composition. No real OS branding, no readable fake UI text, no logos.", "4:5"],
  ["expansion-space-cat-mascot", "Space Cat Mascot", "character", ["cat", "space", "mascot"], "Design an original space cat mascot character with rounded astronaut suit, expressive face, compact silhouette, sticker-friendly outline, and consistent limbs. No existing characters, no logos, no extra tails.", "1:1"],
  ["expansion-bakery-bear-mascot", "Bakery Bear Mascot", "character", ["bear", "bakery", "mascot"], "Design an original bakery bear mascot holding a small bread basket, warm colors, soft rounded shapes, friendly expression, and clean brand-safe character style. No existing mascots, no logos, no extra limbs.", "1:1"],
  ["expansion-plant-care-robot-character", "Plant Care Robot Character", "character", ["robot", "plant care", "assistant"], "Design an original plant care robot character with watering can module, leaf-shaped antenna, gentle expression, clean silhouette, and simple repeatable details. No existing robot designs, no logos, no extra arms.", "1:1"],
  ["expansion-library-owl-mascot", "Library Owl Mascot", "character", ["owl", "library", "mascot"], "Design an original library owl mascot with round glasses, small book stack, cozy academic mood, clean outline, and consistent sticker-ready proportions. No existing mascots, no logos, no extra wings.", "1:1"],
  ["expansion-pixel-adventure-hero-character", "Pixel Adventure Hero Character", "character", ["pixel", "adventure", "hero"], "Design an original pixel-art adventure hero character sheet with front view, side view, expression icons, readable silhouette, and limited color palette. No existing game characters, no logos, no weapons focus.", "1:1"],
  ["expansion-cloud-chef-character", "Cloud Chef Character", "character", ["cloud", "chef", "mascot"], "Design an original cloud chef mascot with puffy silhouette, tiny chef hat, friendly kitchen expression, simple limbs, and clean sticker-ready outline. No existing mascots, no logos, no extra arms.", "1:1"],
  ["expansion-mountain-guide-fox-character", "Mountain Guide Fox Character", "character", ["fox", "mountain", "guide"], "Design an original mountain guide fox character with small backpack, scarf, confident friendly pose, earthy colors, and clean silhouette consistency. No existing characters, no logos, no extra tails.", "1:1"],
  ["expansion-study-buddy-dino-character", "Study Buddy Dino Character", "character", ["dino", "education", "mascot"], "Design an original study buddy dinosaur mascot with notebook, gentle expression, rounded proportions, soft classroom colors, and repeatable character details. No existing characters, no logos, no extra limbs.", "1:1"],
  ["expansion-delivery-duck-character", "Delivery Duck Character", "character", ["duck", "delivery", "mascot"], "Design an original delivery duck mascot with small courier bag, energetic pose, simple yellow palette, clean outline, and friendly app-brand feeling. No existing mascots, no logos, no extra wings.", "1:1"],
  ["expansion-moon-rabbit-sticker-sheet", "Moon Rabbit Sticker Sheet", "character", ["rabbit", "moon", "sticker"], "Design an original moon rabbit sticker sheet with 8 consistent poses, soft night palette, tiny moon props, rounded shapes, and clear white sticker outlines. No existing characters, no logos, no extra limbs.", "1:1"],
  ["expansion-matte-vs-glossy-bottle-test", "Matte vs Glossy Bottle Test", "test", ["matte", "glossy", "product test"], "Create a controlled visual comparison showing the same unbranded bottle rendered in matte ceramic, satin plastic, and glossy glass. Keep framing, light, and background identical. No logos, no text, no extra props.", "4:5"],
  ["expansion-natural-vs-studio-light-portrait-test", "Natural vs Studio Light Portrait Test", "test", ["lighting", "portrait", "comparison"], "Create a controlled portrait lighting comparison of the same original person under window light, softbox studio light, and neon practical light. Keep pose and framing consistent. No celebrity resemblance, no logos.", "4:5"],
  ["expansion-topdown-vs-angled-flatlay-test", "Topdown vs Angled Flat Lay Test", "test", ["flat lay", "angle", "comparison"], "Create a controlled product flat lay comparison showing the same stationery objects from top-down, 45-degree, and low angled perspectives. Keep props and palette consistent. No logos, no readable text.", "4:5"],
  ["expansion-minimal-vs-maximal-poster-test", "Minimal vs Maximal Poster Test", "test", ["poster", "layout", "comparison"], "Create a controlled poster layout comparison using the same abstract subject in minimal, balanced, and maximal compositions. Keep palette consistent and show clear hierarchy differences. No readable text, no logos.", "4:5"],
  ["expansion-soft-vs-hard-shadow-product-test", "Soft vs Hard Shadow Product Test", "test", ["shadow", "product", "lighting"], "Create a controlled product photography test showing the same unbranded object with soft shadow, hard shadow, and rim-light shadow setups. Keep camera angle and background identical. No logos, no text.", "4:5"],
  ["expansion-pastel-vs-bold-palette-ui-test", "Pastel vs Bold Palette UI Test", "test", ["palette", "UI", "comparison"], "Create a controlled mobile UI style comparison showing the same simple dashboard in pastel, neutral, and bold color palettes. Keep layout identical. No real brand names, no tiny unreadable text.", "4:5"],
  ["expansion-wide-vs-square-crop-photo-test", "Wide vs Square Crop Photo Test", "test", ["crop", "photography", "comparison"], "Create a controlled photography composition comparison of the same cafe scene cropped wide landscape, square editorial, and vertical social framing. Keep light and subject consistent. No logos, no readable signs.", "4:5"],
  ["expansion-illustration-vs-photo-product-test", "Illustration vs Photo Product Test", "test", ["style", "product", "comparison"], "Create a controlled style comparison showing the same unbranded product as photoreal studio shot, soft 3D render, and editorial illustration. Keep composition and color palette consistent. No logos, no text.", "4:5"],
  ["expansion-clean-vs-textured-background-test", "Clean vs Textured Background Test", "test", ["background", "product", "comparison"], "Create a controlled product background comparison using the same unbranded skincare bottle on clean white, stone texture, and fabric texture backgrounds. Keep lighting and camera angle identical. No logos, no text.", "4:5"],
  ["expansion-icon-density-infographic-test", "Icon Density Infographic Test", "test", ["infographic", "icons", "comparison"], "Create a controlled infographic comparison showing low, medium, and high icon density for the same simple workflow. Keep section count and palette consistent. No tiny unreadable text, no logos.", "4:5"]
];

const balancingItems = [
  ["expansion-coffee-roastery-documentary-photo", "Coffee Roastery Documentary Photo", "photography", ["coffee", "roastery", "documentary"], "Create a realistic documentary photo inside a small coffee roastery, burlap sacks, roasting machine details, warm industrial light, and natural working atmosphere. No logos, no readable labels, no staged commercial look.", "3:2"],
  ["expansion-winter-bookshop-photo", "Winter Bookshop Photo", "photography", ["bookshop", "winter", "editorial"], "Create an editorial winter bookshop photo with frosted window, warm shelves, soft lamp glow, and cozy street reflection mood. No readable book covers, no logos, no recognizable faces.", "3:2"],
  ["expansion-night-train-platform-photo", "Night Train Platform Photo", "photography", ["train", "night", "documentary"], "Create a cinematic night train platform documentary photo with wet concrete reflections, soft station lights, distant train silhouette, and quiet travel mood. No readable signs, no logos, no close-up faces.", "3:2"],
  ["expansion-community-nurse-portrait", "Community Nurse Portrait", "portrait", ["nurse", "community", "editorial"], "Create a respectful editorial portrait of an original community nurse in a bright clinic hallway, calm expression, natural light, and realistic skin detail. No logos, no readable badges, no celebrity resemblance.", "4:5"],
  ["expansion-independent-bookstore-owner-portrait", "Independent Bookstore Owner Portrait", "portrait", ["bookstore", "owner", "portrait"], "Create a warm editorial portrait of an original independent bookstore owner among shelves, soft reading light, relaxed posture, and authentic small-business mood. No readable book covers, no logos, no celebrity resemblance.", "4:5"],
  ["expansion-ocean-turtle-mascot", "Ocean Turtle Mascot", "character", ["turtle", "ocean", "mascot"], "Design an original ocean turtle mascot with gentle expression, small wave scarf, rounded silhouette, clean sticker outline, and marine conservation mood. No existing characters, no logos, no extra limbs.", "1:1"],
  ["expansion-tiny-mail-dragon-character", "Tiny Mail Dragon Character", "character", ["dragon", "mail", "mascot"], "Design an original tiny mail dragon mascot carrying a small envelope bag, friendly expression, compact silhouette, warm colors, and clean app-icon readability. No existing characters, no logos, no extra wings.", "1:1"],
  ["expansion-portrait-lens-comparison-test", "Portrait Lens Comparison Test", "test", ["lens", "portrait", "comparison"], "Create a controlled portrait lens comparison of the same original person at wide, standard, and telephoto focal lengths. Keep expression, wardrobe, and lighting consistent. No celebrity resemblance, no logos.", "4:5"],
  ["expansion-product-prop-density-test", "Product Prop Density Test", "test", ["props", "product", "comparison"], "Create a controlled product staging comparison showing the same unbranded product with no props, minimal props, and rich props. Keep camera and lighting identical. No logos, no readable text.", "4:5"],
  ["expansion-ui-card-radius-test", "UI Card Radius Test", "test", ["UI", "cards", "comparison"], "Create a controlled UI style comparison showing the same dashboard cards with sharp, medium-rounded, and pill-rounded corners. Keep layout and content hierarchy identical. No real brand names, no tiny text.", "4:5"]
];

const allRaw = [...moreItems, ...finalItems, ...balancingItems];
const finalBatches = [...batches];
for (let i = 0; i < Math.ceil(allRaw.length / 20); i += 1) {
  finalBatches.push({
    name: `priority-batch-${String(i + 7).padStart(2, "0")}`,
    items: allRaw.slice(i * 20, (i + 1) * 20)
  });
}

fs.mkdirSync(outDir, { recursive: true });

const negativeByCategory = {
  product: "no logos, no readable fake text, no watermark, no duplicated product, no distorted geometry, no clutter",
  poster: "no readable fake text, no logo, no watermark, no celebrity faces, no copied brand style, no cluttered layout",
  ui: "no real brand names, no unreadable microtext, no watermark, no distorted device frame, no cluttered interface",
  infographic: "no tiny unreadable text, no logo, no watermark, no dense clutter, no misleading claims",
  photography: "no logos, no readable signs, no watermark, no recognizable faces, no overprocessed AI look",
  portrait: "no celebrity resemblance, no logos, no watermark, no distorted hands, no artificial skin smoothing",
  typography: "no logo imitation, no unreadable letterforms, no watermark, no clutter, no fake brand names",
  character: "no existing characters, no logos, no watermark, no extra limbs, no copied mascot style",
  test: "no logo, no watermark, no dense clutter, no inconsistent comparison variables"
};

const sizeMap = {
  "4:5": "1024x1536",
  "9:16": "1024x1536",
  "1:1": "1024x1024",
  "3:2": "1536x1024"
};

function toItem(raw, index, batchName) {
  const [id, title, category, tags, prompt, aspectRatio] = raw;
  return {
    id,
    title,
    category,
    tags,
    prompt,
    negativePrompt: negativeByCategory[category] || "no logos, no watermark, no clutter",
    aspectRatio,
    seoIntent: `${category} prompt examples`,
    generation: { candidateCount: 1 },
    status: "needs_generation",
    priority: index + 1,
    queue: batchName
  };
}

for (const batch of finalBatches) {
  const items = batch.items.map((raw, index) => toItem(raw, index, batch.name));
  const jsonPath = path.join(outDir, `${batch.name}.json`);
  const jsonlPath = path.join(outDir, `${batch.name}.jsonl`);
  const lines = items.map((item) =>
    JSON.stringify({
      model: "gpt-image-2",
      prompt: [
        item.prompt,
        `Final format: ${item.aspectRatio} composition, strong thumbnail readability, clean PromptArc gallery crop.`,
        `Negative prompt: ${item.negativePrompt}.`
      ].join(" "),
      size: sizeMap[item.aspectRatio] || "1024x1536",
      quality: "low",
      output_format: "png",
      out: `${item.id}.png`
    })
  );

  fs.writeFileSync(jsonPath, JSON.stringify(items, null, 2) + "\n", "utf8");
  fs.writeFileSync(jsonlPath, lines.join("\n") + "\n", "utf8");
  console.log(`Wrote ${batch.name}: ${items.length} items`);
}
