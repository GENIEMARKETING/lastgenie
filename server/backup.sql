PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    TEXT PRIMARY KEY NOT NULL,
    "checksum"              TEXT NOT NULL,
    "finished_at"           DATETIME,
    "migration_name"        TEXT NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        DATETIME,
    "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
);
INSERT INTO _prisma_migrations VALUES('70caa3a2-3220-4934-9602-0580c7d1abda','fbe194ebee06bce600844e1f5213b0dddc121a54fca954886c60fc7e6813ad0c',1769185492132,'20260123162452_init',NULL,NULL,1769185492122,1);
INSERT INTO _prisma_migrations VALUES('0b546473-4830-4a1f-8849-11d6f4a2a18f','a06cdf80875a2411fbd1436a860a0e3b7d3a80eb8f965db0d7889a8461cfbfc9',1769193372697,'20260123183612_add_product_dimensions',NULL,NULL,1769193372695,1);
INSERT INTO _prisma_migrations VALUES('9ba0f394-aeb6-46b4-a34c-0b26aae7d8ad','3531d6e82454273809bb93013d53dac472dff1048a85d766185cd0702297deb4',1769205735919,'20260123170205_add_phone_to_addresses','',NULL,1769205735919,0);
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "first_name" TEXT,
    "last_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'customer',
    "is_age_verified" BOOLEAN NOT NULL DEFAULT false,
    "age_verification_timestamp" DATETIME,
    "email_verified" DATETIME,
    "email_verification_token" TEXT,
    "email_verification_token_expiry" DATETIME,
    "password_reset_token" TEXT,
    "password_reset_token_expiry" DATETIME,
    "stripe_customer_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
, "phone" TEXT);
INSERT INTO users VALUES('cmkr3dch10004ws1450xkxwe9','admin@lastgenie.com','$2b$10$CGK5nXymRrROlYwkCVjx0ep6WzdJC02v7Pj0/mpBakV7HKJZp20ga','Admin','User','admin',0,NULL,'2026-01-23T16:25:05.124+00:00',NULL,NULL,NULL,NULL,NULL,'2026-01-23T16:25:05.125+00:00','2026-01-23T16:25:05.125+00:00',NULL);
INSERT INTO users VALUES('cmkr3dch20005ws14nq4kzhu0','superadmin@lastgenie.com','$2b$10$BU7sD1s2jNfcvDfP9ndq6.mRJV9WA.8QCYVgTrf9ZDdsxVhbyfMza','Super','Admin','super_admin',0,NULL,'2026-01-23T16:25:05.126+00:00',NULL,NULL,NULL,NULL,NULL,'2026-01-23T16:25:05.126+00:00','2026-01-23T16:25:05.126+00:00',NULL);
INSERT INTO users VALUES('cmkr4lnoc0000kt1457tdj74x','infogeniellc@gmail.com','$2b$12$vDzbZU6X2lIhHEOMqsmeSeTPuBZJ5fLoyN5j/PmWO2Q6V6EDg44va','vinn','test','customer',1,'2026-01-23T17:24:20.775+00:00','2026-01-23T16:59:34.739+00:00',NULL,NULL,NULL,NULL,NULL,'2026-01-23T16:59:32.508+00:00','2026-01-23T17:24:20.776+00:00',NULL);
INSERT INTO users VALUES('cmkrd3pkb00006114mi1yrvvb','test1122@example.com','$2b$12$R0sZ1zEFhenhGeQKh.aj2.l7wfEbXLxy0KS57mbr1GTbBsR0Bo7Ra','va','te','customer',1,'2026-01-23T20:57:40.136+00:00','2026-01-23T20:57:34.422+00:00',NULL,NULL,NULL,NULL,NULL,'2026-01-23T20:57:31.690+00:00','2026-01-23T20:57:40.138+00:00',NULL);
INSERT INTO users VALUES('cmkrdfi9100036114er3d21e8','test22@example.com','$2b$12$Jz6S3v0XOrLtePys1sc8UO1aazTo.AKVN0zG0xYLS.uzFcAMev4ku','va','te','customer',1,'2026-01-23T21:06:49.430+00:00','2026-01-23T21:06:44.506+00:00',NULL,NULL,NULL,NULL,NULL,'2026-01-23T21:06:42.085+00:00','2026-01-23T21:06:49.431+00:00',NULL);
INSERT INTO users VALUES('cmkrh8iy10002x414rn7sh8ht','test21@example.com','$2b$12$BdpX/FOlTl93j8jYJr6jyOsOZMPXczGTNLaQLJetXEtlOckh4AYNm','va','te','customer',1,'2026-01-23T22:56:49.772+00:00','2026-01-23T22:53:19.091+00:00',NULL,NULL,NULL,NULL,NULL,'2026-01-23T22:53:14.857+00:00','2026-01-23T22:56:49.773+00:00',NULL);
CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "original_price" REAL,
    "image_url" TEXT,
    "images" JSONB,
    "category" TEXT NOT NULL,
    "package_size" TEXT NOT NULL,
    "is_subscribable" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
, "height" REAL, "length" REAL, "weight" REAL, "width" REAL);
INSERT INTO products VALUES('cmkr3dcdp0000ws14qzmc8j8s','genie-for-him','Genie for Him','Boost Your Confidence & Vitality. A specially formulated drink designed to support male vitality and confidence. Our unique blend of natural ingredients enhances energy, stamina, and overall well-being.',10.0,NULL,'/images/products/genie-for-him/genie-for-him-1.webp',NULL,'male','single',1,1,0,0,NULL,NULL,'2026-01-23T16:25:05.005+00:00','2026-01-23T18:36:38.203+00:00',4.0,2.0,0.002200000000000000133,2.0);
INSERT INTO products VALUES('cmkr3dcds0001ws147jjlrmbf','genie-for-her','Genie for Her','Enhance Your Confidence & Wellness. A specially formulated drink designed to support female vitality and confidence. Our unique blend of natural ingredients enhances energy, mood, and overall well-being.',10.0,NULL,'/images/products/genie-for-her/genie-for-her-1.webp',NULL,'female','single',1,1,0,0,NULL,NULL,'2026-01-23T16:25:05.008+00:00','2026-01-23T18:36:38.205+00:00',4.0,2.0,0.002200000000000000133,2.0);
INSERT INTO products VALUES('cmkr3dcdt0002ws1427xggs8b','genie-for-him-12pack','Genie for Him - 12 Pack','Boost Your Confidence & Vitality - 12 Pack. Stock up and save with our 12-pack of Genie for Him. Perfect for regular use with significant savings per bottle.',99.0,NULL,'/images/products/genie-for-him/genie-for-him-1.webp',NULL,'male','twelve_pack',1,1,0,0,NULL,NULL,'2026-01-23T16:25:05.009+00:00','2026-01-23T18:36:38.207+00:00',3.5,6.5,0.02639999999999999986,5.0);
INSERT INTO products VALUES('cmkr3dcdu0003ws14zym5bxnm','genie-for-her-12pack','Genie for Her - 12 Pack','Enhance Your Confidence & Wellness - 12 Pack. Stock up and save with our 12-pack of Genie for Her. Perfect for regular use with significant savings per bottle.',99.0,NULL,'/images/products/genie-for-her/genie-for-her-1.webp',NULL,'female','twelve_pack',1,1,0,0,NULL,NULL,'2026-01-23T16:25:05.010+00:00','2026-01-23T18:36:38.208+00:00',3.5,6.5,0.02639999999999999986,5.0);
CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "shipping_address_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "interval" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "next_billing_date" DATETIME NOT NULL,
    "stripe_subscription_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "subscriptions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "subscriptions_shipping_address_id_fkey" FOREIGN KEY ("shipping_address_id") REFERENCES "addresses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "shipping_address_id" TEXT NOT NULL,
    "subscription_id" TEXT,
    "status" TEXT NOT NULL,
    "total_amount" REAL NOT NULL,
    "shipping_amount" REAL,
    "tax_amount" REAL,
    "shipping_carrier" TEXT,
    "tracking_number" TEXT,
    "stripe_session_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_shipping_address_id_fkey" FOREIGN KEY ("shipping_address_id") REFERENCES "addresses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "orders_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "order_items" (
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price_per_unit" REAL NOT NULL,

    PRIMARY KEY ("order_id", "product_id"),
    CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "is_verified_purchase" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "author_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "published_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO blog_posts VALUES('cmkr63cnj0000uo14bdvyaxqk','cmkr3dch10004ws1450xkxwe9','5 Ways to Naturally Boost Intimacy in Your Relationship','boost-intimacy-naturally',unistr('## Introduction\u000a\u000aIn our busy lives, it''s easy for intimacy to take a backseat. But nurturing that connection is vital for a healthy, happy relationship. Whether you''re in a new relationship or have been together for years, there are natural, meaningful ways to deepen your bond and enhance intimacy.\u000a\u000aThe good news? You don''t need complicated solutions. Simple, intentional practices can make a significant difference in how connected you feel to your partner.\u000a\u000a## 1. Prioritize Quality Time Together\u000a\u000aIn today''s fast-paced world, spending meaningful time together often gets pushed aside. But quality time is the foundation of intimacy.\u000a\u000a### Why It Matters\u000a\u000aWhen you''re fully present with your partner—not distracted by phones, work, or to-do lists—you create space for deeper connection. Research shows that couples who engage in shared activities report higher relationship satisfaction.\u000a\u000a### How to Do It\u000a\u000a- Schedule regular date nights (even if they''re at home)\u000a- Try new activities together\u000a- Have device-free conversations\u000a- Take short walks and talk about your day\u000a\u000aRemember: It''s not about the quantity of time, but the quality of your attention.\u000a\u000a## 2. Communicate Openly and Honestly\u000a\u000aOpen communication is the bedrock of emotional intimacy. When you can share your thoughts, feelings, and desires without fear of judgment, you build trust and closeness.\u000a\u000a### Start Small\u000a\u000aYou don''t need to have deep, profound conversations every day. Start with small moments of vulnerability:\u000a\u000a- Share something you''re grateful for\u000a- Express appreciation for something your partner did\u000a- Talk about your day, including the challenges\u000a\u000a### Practice Active Listening\u000a\u000aWhen your partner shares something, listen with the intent to understand, not to respond. This simple shift can transform your conversations and deepen your connection.\u000a\u000a## 3. Embrace Physical Touch Beyond Intimacy\u000a\u000aPhysical affection isn''t just about the bedroom. Regular, non-sexual touch releases oxytocin—the "bonding hormone"—which promotes feelings of trust and closeness.\u000a\u000a### Simple Ways to Increase Touch\u000a\u000a- Hold hands while watching TV\u000a- Give hugs when greeting each other\u000a- Sit close together\u000a- Give shoulder massages\u000a- Kiss goodnight and good morning\u000a\u000aThese small gestures of physical connection add up to create a stronger foundation of intimacy.\u000a\u000a## 4. Practice Mindfulness Together\u000a\u000aStress is one of the biggest intimacy killers. When you''re both overwhelmed with daily responsibilities, it''s hard to feel connected.\u000a\u000a### Mindfulness Exercises for Couples\u000a\u000a- Meditate together for just 5 minutes\u000a- Practice deep breathing exercises\u000a- Go for mindful walks in nature\u000a- Do yoga together\u000a\u000aWhen you''re both calmer and more present, you create better conditions for intimacy to flourish.\u000a\u000a## 5. Support Each Other''s Individual Growth\u000a\u000aParadoxically, supporting each other''s individual growth can strengthen your relationship. When both partners feel fulfilled as individuals, they bring more to the relationship.\u000a\u000a### How to Support Growth\u000a\u000a- Encourage each other''s hobbies and interests\u000a- Celebrate individual achievements\u000a- Give space for personal development\u000a- Respect each other''s alone time\u000a\u000aRemember: Two whole people make a better couple than two halves trying to complete each other.\u000a\u000a## Natural Supplements and Products\u000a\u000aWhile relationship work is essential, some natural products can support your intimacy goals. Genie''s sexual wellness drinks are designed to complement your efforts, not replace them.\u000a\u000aMade with natural ingredients like Ashwagandha, Maca Root, and Damiana Leaf, these formulations are crafted to support your body''s natural vitality and responsiveness.\u000a\u000a## Conclusion\u000a\u000aEnhancing intimacy is an ongoing journey, not a destination. By incorporating these natural, intentional practices into your relationship, you''re investing in your connection and your shared happiness.\u000a\u000aRemember: Small, consistent actions create lasting change. Start with one or two of these practices and build from there. Your relationship—and your partner—will thank you.\u000a\u000a---\u000a\u000a**Ready to take the next step?** Explore our products designed to support your intimacy journey, naturally and authentically.'),'Rediscover connection with your partner. Here are 5 science-backed, natural ways to enhance intimacy and bring the spark back into your relationship.','published','2024-11-15T00:00:00.000+00:00','2026-01-23T17:41:17.647+00:00','2026-01-23T17:41:17.647+00:00');
INSERT INTO blog_posts VALUES('cmkr63cnm0001uo14mx47pwrx','cmkr3dch10004ws1450xkxwe9','Real Stories, Real Connections: How Genie Changed My Relationship','real-stories-real-connections',unistr('## Building a Community of Support\u000a\u000aAt Genie, we believe that sharing stories creates connection. When we talk openly about sexual wellness, we remove stigma and create space for everyone to feel empowered about their intimate lives.\u000a\u000aThat''s why we''re honored to share some real stories from our community. These aren''t just testimonials—they''re windows into how people are taking charge of their wellness and strengthening their relationships.\u000a\u000a## Sarah''s Story: Rediscovering Connection After Kids\u000a\u000a*Sarah, 34, mother of two*\u000a\u000a"My husband and I had been together for 12 years, and like many couples with young children, intimacy had taken a backseat. Between work, kids, and exhaustion, we just weren''t prioritizing each other anymore.\u000a\u000aI was skeptical at first—I''ve tried wellness products before with mixed results. But after three weeks of using Genie for Her, I noticed I had more energy and, honestly, more desire to reconnect with my partner.\u000a\u000aThe best part? It wasn''t just about the bedroom. When I felt better about myself and had more energy, I was more present with my husband in general. We started having real conversations again, going on date nights, and actually laughing together like we used to.\u000a\u000aNow, Genie is part of our routine. It''s not a magic solution, but it''s been a tool that helped us prioritize our relationship again."\u000a\u000a## Mike''s Journey: Confidence and Connection\u000a\u000a*Mike, 42, busy professional*\u000a\u000a"As someone in their 40s, I had noticed changes in my energy levels and confidence. I was working long hours, stressed, and honestly just not feeling like myself.\u000a\u000aI tried Genie for Him after reading about the natural ingredients. What I loved was that it wasn''t just about one thing—it helped with my energy during the day, my sleep at night, and my overall confidence.\u000a\u000aMy partner noticed the difference too. Not just physically, but in my overall mood and presence. When you feel better, it shows. We''ve become closer because I''m more present and confident in our relationship.\u000a\u000aI''ve been using it for about four months now, and it''s become part of my wellness routine alongside exercise and better nutrition."\u000a\u000a## Jessica and David: Reconnecting After Years Together\u000a\u000a*Jessica, 38, and David, 40, together for 15 years*\u000a\u000a**Jessica:** "After 15 years together, things had become routine. Not bad, just... routine. We loved each other, but the spark had dimmed.\u000a\u000aA friend mentioned she was trying Genie, so David and I decided to try both formulas. We approached it as something we''d do together, which made it feel like we were investing in our relationship."\u000a\u000a**David:** "I''ll be honest—I was skeptical. But Jessica wanted to try, so I agreed. The first thing I noticed was better sleep, which helped my energy during the day. Then I noticed other changes.\u000a\u000aWhat surprised me was that it wasn''t just about us. When we both had more energy and felt better, we started doing more things together—cooking, hiking, trying new restaurants. The intimacy followed naturally because we were reconnecting as people."\u000a\u000a**Jessica:** "Exactly. It wasn''t a quick fix, but it gave us both the support we needed to put energy back into our relationship. We''re closer now than we''ve been in years."\u000a\u000a## Emily''s Empowerment Story\u000a\u000a*Emily, 31*\u000a\u000a"For me, sexual wellness has always been about empowerment. I want to feel in control of my body and my choices. That''s why I appreciated Genie''s transparency about ingredients and approach.\u000a\u000aUsing Genie for Her has been part of a larger journey of taking care of myself. When I prioritize my wellness—whether that''s supplements, exercise, or self-care—I show up better in all areas of my life, including my relationship.\u000a\u000aMy partner appreciates that I''m taking care of myself. When you invest in yourself, it benefits your relationship too. We''re both happier and more connected because I''m more confident and present."\u000a\u000a## What These Stories Tell Us\u000a\u000aWhile everyone''s experience is unique, common themes emerge:\u000a\u000a1. **It''s Not Just About One Thing** - These products support overall wellness, not just one aspect\u000a2. **Consistency Matters** - Results build over time with regular use\u000a3. **Relationships Are Complex** - Better intimacy comes from feeling better overall\u000a4. **Communication is Key** - Many couples approached this together, which strengthened their connection\u000a\u000a## Your Story Matters\u000a\u000aWe''re grateful to everyone who has shared their journey with us. Every story helps someone else feel less alone and more empowered to take charge of their wellness.\u000a\u000a**Important Note:** Individual results vary. These stories are shared with permission and represent individual experiences. Genie supports overall wellness, but results depend on many factors including lifestyle, health status, and consistency of use.\u000a\u000a## Join Our Community\u000a\u000aWant to connect with others on their wellness journey? Join our community to:\u000a\u000a- Share your experiences (anonymously if preferred)\u000a- Get tips and support\u000a- Learn from others'' stories\u000a- Be part of a movement toward better sexual wellness\u000a\u000a## The Bottom Line\u000a\u000aReal stories from real people remind us that we''re not alone in wanting to feel our best and have strong, intimate relationships. Whether you''re navigating life changes, reconnecting with a long-term partner, or simply wanting to optimize your wellness, your story matters.\u000a\u000a---\u000a\u000a**Ready to write your own story?** Explore our products and start your journey toward better wellness and deeper connection.'),'Real stories from real couples. Discover how Genie has helped people reconnect, rediscover intimacy, and strengthen their relationships.','published','2024-12-01T00:00:00.000+00:00','2026-01-23T17:41:17.650+00:00','2026-01-23T17:41:17.650+00:00');
INSERT INTO blog_posts VALUES('cmkr63cno0002uo14nzngfdqz','cmkr3dch10004ws1450xkxwe9','The Science Behind Genie: Understanding Our Natural Ingredients','the-science-behind-genie',unistr('## Our Commitment to Transparency\u000a\u000aAt Genie, we believe you deserve to know exactly what you''re putting into your body. That''s why we''re committed to complete transparency about our ingredients, their sources, and the scientific research behind them.\u000a\u000aEvery ingredient in Genie has been carefully selected based on traditional use, modern research, and safety profiles. We never make unverified medical claims—instead, we share the facts and let you decide.\u000a\u000a## Key Ingredients in Genie for Him\u000a\u000aOur male-focused formula combines time-tested botanicals with modern understanding of sexual wellness.\u000a\u000a### Ashwagandha (Withania somnifera)\u000a\u000a**What it is:** A powerful adaptogenic herb native to India, used in Ayurvedic medicine for over 3,000 years.\u000a\u000a**The Science:** Multiple studies suggest Ashwagandha may support:\u000a- Stress reduction and cortisol management\u000a- Testosterone levels in men\u000a- Overall energy and vitality\u000a\u000a**Why We Use It:** Stress is a major factor in sexual wellness. By supporting the body''s stress response, Ashwagandha helps create better conditions for intimacy.\u000a\u000a### Maca Root (Lepidium meyenii)\u000a\u000a**What it is:** A cruciferous vegetable native to the Andes mountains of Peru, traditionally used to support energy and vitality.\u000a\u000a**The Science:** Research indicates Maca may help with:\u000a- Energy and endurance\u000a- Libido and sexual function\u000a- Mood and overall wellness\u000a\u000a**Why We Use It:** Maca has a long history of traditional use for vitality, and modern research supports its potential benefits.\u000a\u000a### Tribulus Terrestris\u000a\u000a**What it is:** A plant native to warm regions of Europe, Asia, and Africa, used in traditional medicine.\u000a\u000a**The Science:** Studies suggest Tribulus may support:\u000a- Testosterone production\u000a- Energy levels\u000a- Overall vitality\u000a\u000a**Why We Use It:** This traditional botanical has been researched for its potential to support male wellness naturally.\u000a\u000a## Key Ingredients in Genie for Her\u000a\u000aOur female-focused formula is specially designed to support women''s unique wellness needs.\u000a\u000a### Damiana Leaf (Turnera diffusa)\u000a\u000a**What it is:** A small shrub native to Central and South America, traditionally used to support female wellness.\u000a\u000a**The Science:** Traditional use and modern research suggest Damiana may help with:\u000a- Female libido and desire\u000a- Mood and emotional wellness\u000a- Overall vitality\u000a\u000a**Why We Use It:** Damiana has a long history of traditional use for supporting women''s wellness and intimacy.\u000a\u000a### Red Clover (Trifolium pratense)\u000a\u000a**What it is:** A wild plant in the legume family, rich in isoflavones.\u000a\u000a**The Science:** Research indicates Red Clover may support:\u000a- Hormonal balance\u000a- Cardiovascular health\u000a- Bone health\u000a\u000a**Why We Use It:** The isoflavones in Red Clover can support natural hormonal balance, which is important for overall wellness.\u000a\u000a### Ginkgo Biloba\u000a\u000a**What it is:** One of the oldest tree species on Earth, used in traditional Chinese medicine for thousands of years.\u000a\u000a**The Science:** Studies suggest Ginkgo may support:\u000a- Circulation and blood flow\u000a- Cognitive function\u000a- Antioxidant activity\u000a\u000a**Why We Use It:** Proper circulation is essential for sexual wellness, and Ginkgo is well-researched for its circulation-supporting properties.\u000a\u000a## How Our Formulas Work Together\u000a\u000aOur ingredients aren''t just thrown together—they''re carefully formulated to work synergistically:\u000a\u000a1. **Support the stress response** - Ingredients like Ashwagandha help manage stress\u000a2. **Support circulation** - Ginkgo and other botanicals support healthy blood flow\u000a3. **Support hormonal balance** - Selected ingredients support natural hormone production\u000a4. **Provide essential nutrients** - Vitamins and minerals fill nutritional gaps\u000a\u000a## Safety and Quality Standards\u000a\u000aWe take safety seriously. Every batch of Genie is:\u000a\u000a- Manufactured in FDA-registered facilities\u000a- Tested for purity and potency\u000a- Free from harmful additives\u000a- Made with natural, non-GMO ingredients\u000a\u000a## Understanding the Timeline\u000a\u000aNatural supplements work differently than pharmaceutical products. Here''s what to expect:\u000a\u000a- **Week 1-2:** You may notice subtle changes in energy and mood\u000a- **Week 2-4:** More noticeable effects on vitality and responsiveness\u000a- **Month 2+:** Optimal results as your body adapts to the natural ingredients\u000a\u000aRemember: Individual results vary, and supplements work best when combined with a healthy lifestyle.\u000a\u000a## Frequently Asked Questions\u000a\u000a### Are your ingredients scientifically proven?\u000a\u000aYes. All our ingredients have been studied for their traditional uses and many have modern research supporting their potential benefits. We''re transparent about what the science says—and what it doesn''t say yet.\u000a\u000a### Are there any side effects?\u000a\u000aOur natural formulations are generally well-tolerated. However, if you have medical conditions or take medications, we recommend consulting with your healthcare provider.\u000a\u000a### Can I take Genie with other supplements?\u000a\u000aGenerally yes, but we recommend checking with your healthcare provider, especially if you''re taking prescription medications.\u000a\u000a## The Bottom Line\u000a\u000aWe believe in empowering you with knowledge. The science behind Genie combines traditional wisdom with modern research to create safe, effective formulations you can trust.\u000a\u000aWant to learn more? Visit our [Science page](/science) for detailed ingredient information and links to research studies.\u000a\u000a---\u000a\u000a**Ready to experience the difference?** Try Genie for yourself and feel the natural support your body deserves.'),'We believe in transparency. Discover the science-backed natural ingredients in Genie and how they work together to support your wellness and vitality.','published','2024-11-20T00:00:00.000+00:00','2026-01-23T17:41:17.652+00:00','2026-01-23T17:41:17.652+00:00');
CREATE TABLE IF NOT EXISTS "contact_submissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "carts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "session_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO carts VALUES('cmkr4lq7n0001kt144tsmfy0l','cmkr4lnoc0000kt1457tdj74x',NULL,'2026-01-23T16:59:35.795+00:00','2026-01-23T16:59:35.795+00:00');
INSERT INTO carts VALUES('cmkrd3sf9000161149fe8u0cn','cmkrd3pkb00006114mi1yrvvb',NULL,'2026-01-23T20:57:35.397+00:00','2026-01-23T20:57:35.397+00:00');
INSERT INTO carts VALUES('cmkrdfkzb00046114mxl10woa','cmkrdfi9100036114er3d21e8',NULL,'2026-01-23T21:06:45.623+00:00','2026-01-23T21:06:45.623+00:00');
INSERT INTO carts VALUES('cmkrh8n490003x414jxee42kh','cmkrh8iy10002x414rn7sh8ht',NULL,'2026-01-23T22:53:20.265+00:00','2026-01-23T22:53:20.265+00:00');
CREATE TABLE IF NOT EXISTS "cart_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cart_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "is_subscription" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO cart_items VALUES('cmkr4nibx0003kt14u0wn6efk','cmkr4lq7n0001kt144tsmfy0l','cmkr3dcdp0000ws14qzmc8j8s',1,0,'2026-01-23T17:00:58.893+00:00','2026-01-23T17:00:58.893+00:00');
INSERT INTO cart_items VALUES('cmkrd3sfb00026114j2fpc11l','cmkrd3sf9000161149fe8u0cn','cmkr3dcdp0000ws14qzmc8j8s',1,0,'2026-01-23T20:57:35.399+00:00','2026-01-23T20:57:35.399+00:00');
INSERT INTO cart_items VALUES('cmkrdfkzc000561143gwov1aq','cmkrdfkzb00046114mxl10woa','cmkr3dcdp0000ws14qzmc8j8s',1,0,'2026-01-23T21:06:45.624+00:00','2026-01-23T21:06:45.624+00:00');
INSERT INTO cart_items VALUES('cmkrh8n4b0004x4143drebqhg','cmkrh8n490003x414jxee42kh','cmkr3dcdp0000ws14qzmc8j8s',1,0,'2026-01-23T22:53:20.266+00:00','2026-01-23T22:53:20.266+00:00');
CREATE TABLE IF NOT EXISTS "affiliate_applications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT NOT NULL,
    "experience" TEXT,
    "marketing_channels" TEXT,
    "admin_notes" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "affiliate_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "affiliates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "referral_code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "commission_rate" REAL NOT NULL DEFAULT 0.10,
    "total_clicks" INTEGER NOT NULL DEFAULT 0,
    "total_conversions" INTEGER NOT NULL DEFAULT 0,
    "total_earnings" REAL NOT NULL DEFAULT 0,
    "pending_earnings" REAL NOT NULL DEFAULT 0,
    "paid_earnings" REAL NOT NULL DEFAULT 0,
    "stripe_connect_id" TEXT,
    "payout_threshold" REAL NOT NULL DEFAULT 50,
    "cookie_duration" INTEGER NOT NULL DEFAULT 30,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "affiliates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "affiliate_clicks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "affiliate_id" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "referer" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "affiliate_clicks_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "affiliates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "affiliate_conversions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "affiliate_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "order_value" REAL NOT NULL,
    "commission_rate" REAL NOT NULL,
    "commission_amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "ip_address" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "affiliate_conversions_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "affiliates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "affiliate_conversions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "affiliate_payouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "affiliate_id" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "method" TEXT NOT NULL DEFAULT 'stripe_connect',
    "stripe_transfer_id" TEXT,
    "processed_at" DATETIME,
    "failure_reason" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "affiliate_payouts_affiliate_id_fkey" FOREIGN KEY ("affiliate_id") REFERENCES "affiliates" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "old_values" JSONB,
    "new_values" JSONB,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "inventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "current_stock" INTEGER NOT NULL DEFAULT 0,
    "reserved_stock" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 10,
    "last_restocked" DATETIME,
    "total_sold" INTEGER NOT NULL DEFAULT 0,
    "total_received" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "stock_movements" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "product_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previous_stock" INTEGER NOT NULL,
    "new_stock" INTEGER NOT NULL,
    "reason" TEXT,
    "order_id" TEXT,
    "admin_user_id" TEXT,
    "metadata" JSONB,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stock_movements_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "addresses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "street_address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip_code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "phone" TEXT,
    "type" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO addresses VALUES('cmkrgw79q0001x4146fcdphga','cmkr4lnoc0000kt1457tdj74x','12720 University Club Dr','Tampa','FL','33612-6594','US','(123) 445-5555','shipping',0,'2026-01-23T22:43:39.854+00:00','2026-01-23T22:43:39.854+00:00');
INSERT INTO addresses VALUES('cmkrh92r20005x4143lx8ikkj','cmkrh8iy10002x414rn7sh8ht','12720 University Club Dr','Tampa','FL','33612-6594','US','(123) 445-5555','shipping',0,'2026-01-23T22:53:40.526+00:00','2026-01-23T22:53:40.526+00:00');
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_stripe_customer_id_key" ON "users"("stripe_customer_id");
CREATE INDEX "users_role_idx" ON "users"("role");
CREATE INDEX "users_created_at_idx" ON "users"("created_at");
CREATE INDEX "users_email_verified_idx" ON "users"("email_verified");
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");
CREATE INDEX "products_is_active_idx" ON "products"("is_active");
CREATE INDEX "products_is_featured_idx" ON "products"("is_featured");
CREATE INDEX "products_display_order_idx" ON "products"("display_order");
CREATE INDEX "products_category_idx" ON "products"("category");
CREATE UNIQUE INDEX "subscriptions_stripe_subscription_id_key" ON "subscriptions"("stripe_subscription_id");
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");
CREATE INDEX "carts_user_id_idx" ON "carts"("user_id");
CREATE INDEX "carts_session_id_idx" ON "carts"("session_id");
CREATE INDEX "cart_items_cart_id_idx" ON "cart_items"("cart_id");
CREATE INDEX "cart_items_product_id_idx" ON "cart_items"("product_id");
CREATE UNIQUE INDEX "affiliate_applications_user_id_key" ON "affiliate_applications"("user_id");
CREATE INDEX "affiliate_applications_status_idx" ON "affiliate_applications"("status");
CREATE INDEX "affiliate_applications_created_at_idx" ON "affiliate_applications"("created_at");
CREATE INDEX "affiliate_applications_reviewed_by_idx" ON "affiliate_applications"("reviewed_by");
CREATE UNIQUE INDEX "affiliates_user_id_key" ON "affiliates"("user_id");
CREATE UNIQUE INDEX "affiliates_referral_code_key" ON "affiliates"("referral_code");
CREATE INDEX "affiliates_status_idx" ON "affiliates"("status");
CREATE INDEX "affiliates_total_earnings_idx" ON "affiliates"("total_earnings");
CREATE INDEX "affiliates_created_at_idx" ON "affiliates"("created_at");
CREATE INDEX "affiliates_stripe_connect_id_idx" ON "affiliates"("stripe_connect_id");
CREATE INDEX "affiliate_clicks_affiliate_id_idx" ON "affiliate_clicks"("affiliate_id");
CREATE INDEX "affiliate_clicks_created_at_idx" ON "affiliate_clicks"("created_at");
CREATE INDEX "affiliate_clicks_ip_address_created_at_idx" ON "affiliate_clicks"("ip_address", "created_at");
CREATE UNIQUE INDEX "affiliate_conversions_order_id_key" ON "affiliate_conversions"("order_id");
CREATE INDEX "affiliate_conversions_affiliate_id_idx" ON "affiliate_conversions"("affiliate_id");
CREATE INDEX "affiliate_conversions_status_idx" ON "affiliate_conversions"("status");
CREATE INDEX "affiliate_conversions_created_at_idx" ON "affiliate_conversions"("created_at");
CREATE INDEX "affiliate_conversions_affiliate_id_created_at_idx" ON "affiliate_conversions"("affiliate_id", "created_at");
CREATE INDEX "affiliate_payouts_affiliate_id_idx" ON "affiliate_payouts"("affiliate_id");
CREATE INDEX "affiliate_payouts_status_idx" ON "affiliate_payouts"("status");
CREATE INDEX "affiliate_payouts_created_at_idx" ON "affiliate_payouts"("created_at");
CREATE INDEX "affiliate_payouts_stripe_transfer_id_idx" ON "affiliate_payouts"("stripe_transfer_id");
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs"("entity");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");
CREATE INDEX "audit_logs_entity_entity_id_idx" ON "audit_logs"("entity", "entity_id");
CREATE UNIQUE INDEX "inventory_product_id_key" ON "inventory"("product_id");
CREATE INDEX "inventory_current_stock_idx" ON "inventory"("current_stock");
CREATE INDEX "inventory_low_stock_threshold_idx" ON "inventory"("low_stock_threshold");
CREATE INDEX "inventory_last_restocked_idx" ON "inventory"("last_restocked");
CREATE INDEX "stock_movements_product_id_idx" ON "stock_movements"("product_id");
CREATE INDEX "stock_movements_type_idx" ON "stock_movements"("type");
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements"("created_at");
CREATE INDEX "stock_movements_admin_user_id_idx" ON "stock_movements"("admin_user_id");
CREATE INDEX "stock_movements_order_id_idx" ON "stock_movements"("order_id");
COMMIT;
