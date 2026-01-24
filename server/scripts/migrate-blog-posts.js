const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');
const path = require('path');

// Set up database path
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';
let dbPath = databaseUrl.replace('file:', '');

// Resolve relative paths relative to server directory
if (!path.isAbsolute(dbPath)) {
  dbPath = path.resolve(__dirname, '..', dbPath);
}

// Create absolute URL for adapter
const absoluteDatabaseUrl = `file:${dbPath}`;
process.env.DATABASE_URL = absoluteDatabaseUrl;

// Create Prisma adapter
const adapter = new PrismaBetterSqlite3({
  url: absoluteDatabaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

const blogPosts = [
  {
    title: '5 Ways to Naturally Boost Intimacy in Your Relationship',
    slug: 'boost-intimacy-naturally',
    content: `## Introduction

In our busy lives, it's easy for intimacy to take a backseat. But nurturing that connection is vital for a healthy, happy relationship. Whether you're in a new relationship or have been together for years, there are natural, meaningful ways to deepen your bond and enhance intimacy.

The good news? You don't need complicated solutions. Simple, intentional practices can make a significant difference in how connected you feel to your partner.

## 1. Prioritize Quality Time Together

In today's fast-paced world, spending meaningful time together often gets pushed aside. But quality time is the foundation of intimacy.

### Why It Matters

When you're fully present with your partner—not distracted by phones, work, or to-do lists—you create space for deeper connection. Research shows that couples who engage in shared activities report higher relationship satisfaction.

### How to Do It

- Schedule regular date nights (even if they're at home)
- Try new activities together
- Have device-free conversations
- Take short walks and talk about your day

Remember: It's not about the quantity of time, but the quality of your attention.

## 2. Communicate Openly and Honestly

Open communication is the bedrock of emotional intimacy. When you can share your thoughts, feelings, and desires without fear of judgment, you build trust and closeness.

### Start Small

You don't need to have deep, profound conversations every day. Start with small moments of vulnerability:

- Share something you're grateful for
- Express appreciation for something your partner did
- Talk about your day, including the challenges

### Practice Active Listening

When your partner shares something, listen with the intent to understand, not to respond. This simple shift can transform your conversations and deepen your connection.

## 3. Embrace Physical Touch Beyond Intimacy

Physical affection isn't just about the bedroom. Regular, non-sexual touch releases oxytocin—the "bonding hormone"—which promotes feelings of trust and closeness.

### Simple Ways to Increase Touch

- Hold hands while watching TV
- Give hugs when greeting each other
- Sit close together
- Give shoulder massages
- Kiss goodnight and good morning

These small gestures of physical connection add up to create a stronger foundation of intimacy.

## 4. Practice Mindfulness Together

Stress is one of the biggest intimacy killers. When you're both overwhelmed with daily responsibilities, it's hard to feel connected.

### Mindfulness Exercises for Couples

- Meditate together for just 5 minutes
- Practice deep breathing exercises
- Go for mindful walks in nature
- Do yoga together

When you're both calmer and more present, you create better conditions for intimacy to flourish.

## 5. Support Each Other's Individual Growth

Paradoxically, supporting each other's individual growth can strengthen your relationship. When both partners feel fulfilled as individuals, they bring more to the relationship.

### How to Support Growth

- Encourage each other's hobbies and interests
- Celebrate individual achievements
- Give space for personal development
- Respect each other's alone time

Remember: Two whole people make a better couple than two halves trying to complete each other.

## Natural Supplements and Products

While relationship work is essential, some natural products can support your intimacy goals. Genie's sexual wellness drinks are designed to complement your efforts, not replace them.

Made with natural ingredients like Ashwagandha, Maca Root, and Damiana Leaf, these formulations are crafted to support your body's natural vitality and responsiveness.

## Conclusion

Enhancing intimacy is an ongoing journey, not a destination. By incorporating these natural, intentional practices into your relationship, you're investing in your connection and your shared happiness.

Remember: Small, consistent actions create lasting change. Start with one or two of these practices and build from there. Your relationship—and your partner—will thank you.

---

**Ready to take the next step?** Explore our products designed to support your intimacy journey, naturally and authentically.`,
    excerpt: 'Rediscover connection with your partner. Here are 5 science-backed, natural ways to enhance intimacy and bring the spark back into your relationship.',
    status: 'published',
    publishedAt: new Date('2024-11-15')
  },
  {
    title: 'Real Stories, Real Connections: How Genie Changed My Relationship',
    slug: 'real-stories-real-connections',
    content: `## Building a Community of Support

At Genie, we believe that sharing stories creates connection. When we talk openly about sexual wellness, we remove stigma and create space for everyone to feel empowered about their intimate lives.

That's why we're honored to share some real stories from our community. These aren't just testimonials—they're windows into how people are taking charge of their wellness and strengthening their relationships.

## Sarah's Story: Rediscovering Connection After Kids

*Sarah, 34, mother of two*

"My husband and I had been together for 12 years, and like many couples with young children, intimacy had taken a backseat. Between work, kids, and exhaustion, we just weren't prioritizing each other anymore.

I was skeptical at first—I've tried wellness products before with mixed results. But after three weeks of using Genie for Her, I noticed I had more energy and, honestly, more desire to reconnect with my partner.

The best part? It wasn't just about the bedroom. When I felt better about myself and had more energy, I was more present with my husband in general. We started having real conversations again, going on date nights, and actually laughing together like we used to.

Now, Genie is part of our routine. It's not a magic solution, but it's been a tool that helped us prioritize our relationship again."

## Mike's Journey: Confidence and Connection

*Mike, 42, busy professional*

"As someone in their 40s, I had noticed changes in my energy levels and confidence. I was working long hours, stressed, and honestly just not feeling like myself.

I tried Genie for Him after reading about the natural ingredients. What I loved was that it wasn't just about one thing—it helped with my energy during the day, my sleep at night, and my overall confidence.

My partner noticed the difference too. Not just physically, but in my overall mood and presence. When you feel better, it shows. We've become closer because I'm more present and confident in our relationship.

I've been using it for about four months now, and it's become part of my wellness routine alongside exercise and better nutrition."

## Jessica and David: Reconnecting After Years Together

*Jessica, 38, and David, 40, together for 15 years*

**Jessica:** "After 15 years together, things had become routine. Not bad, just... routine. We loved each other, but the spark had dimmed.

A friend mentioned she was trying Genie, so David and I decided to try both formulas. We approached it as something we'd do together, which made it feel like we were investing in our relationship."

**David:** "I'll be honest—I was skeptical. But Jessica wanted to try, so I agreed. The first thing I noticed was better sleep, which helped my energy during the day. Then I noticed other changes.

What surprised me was that it wasn't just about us. When we both had more energy and felt better, we started doing more things together—cooking, hiking, trying new restaurants. The intimacy followed naturally because we were reconnecting as people."

**Jessica:** "Exactly. It wasn't a quick fix, but it gave us both the support we needed to put energy back into our relationship. We're closer now than we've been in years."

## Emily's Empowerment Story

*Emily, 31*

"For me, sexual wellness has always been about empowerment. I want to feel in control of my body and my choices. That's why I appreciated Genie's transparency about ingredients and approach.

Using Genie for Her has been part of a larger journey of taking care of myself. When I prioritize my wellness—whether that's supplements, exercise, or self-care—I show up better in all areas of my life, including my relationship.

My partner appreciates that I'm taking care of myself. When you invest in yourself, it benefits your relationship too. We're both happier and more connected because I'm more confident and present."

## What These Stories Tell Us

While everyone's experience is unique, common themes emerge:

1. **It's Not Just About One Thing** - These products support overall wellness, not just one aspect
2. **Consistency Matters** - Results build over time with regular use
3. **Relationships Are Complex** - Better intimacy comes from feeling better overall
4. **Communication is Key** - Many couples approached this together, which strengthened their connection

## Your Story Matters

We're grateful to everyone who has shared their journey with us. Every story helps someone else feel less alone and more empowered to take charge of their wellness.

**Important Note:** Individual results vary. These stories are shared with permission and represent individual experiences. Genie supports overall wellness, but results depend on many factors including lifestyle, health status, and consistency of use.

## Join Our Community

Want to connect with others on their wellness journey? Join our community to:

- Share your experiences (anonymously if preferred)
- Get tips and support
- Learn from others' stories
- Be part of a movement toward better sexual wellness

## The Bottom Line

Real stories from real people remind us that we're not alone in wanting to feel our best and have strong, intimate relationships. Whether you're navigating life changes, reconnecting with a long-term partner, or simply wanting to optimize your wellness, your story matters.

---

**Ready to write your own story?** Explore our products and start your journey toward better wellness and deeper connection.`,
    excerpt: 'Real stories from real couples. Discover how Genie has helped people reconnect, rediscover intimacy, and strengthen their relationships.',
    status: 'published',
    publishedAt: new Date('2024-12-01')
  },
  {
    title: 'The Science Behind Genie: Understanding Our Natural Ingredients',
    slug: 'the-science-behind-genie',
    content: `## Our Commitment to Transparency

At Genie, we believe you deserve to know exactly what you're putting into your body. That's why we're committed to complete transparency about our ingredients, their sources, and the scientific research behind them.

Every ingredient in Genie has been carefully selected based on traditional use, modern research, and safety profiles. We never make unverified medical claims—instead, we share the facts and let you decide.

## Key Ingredients in Genie for Him

Our male-focused formula combines time-tested botanicals with modern understanding of sexual wellness.

### Ashwagandha (Withania somnifera)

**What it is:** A powerful adaptogenic herb native to India, used in Ayurvedic medicine for over 3,000 years.

**The Science:** Multiple studies suggest Ashwagandha may support:
- Stress reduction and cortisol management
- Testosterone levels in men
- Overall energy and vitality

**Why We Use It:** Stress is a major factor in sexual wellness. By supporting the body's stress response, Ashwagandha helps create better conditions for intimacy.

### Maca Root (Lepidium meyenii)

**What it is:** A cruciferous vegetable native to the Andes mountains of Peru, traditionally used to support energy and vitality.

**The Science:** Research indicates Maca may help with:
- Energy and endurance
- Libido and sexual function
- Mood and overall wellness

**Why We Use It:** Maca has a long history of traditional use for vitality, and modern research supports its potential benefits.

### Tribulus Terrestris

**What it is:** A plant native to warm regions of Europe, Asia, and Africa, used in traditional medicine.

**The Science:** Studies suggest Tribulus may support:
- Testosterone production
- Energy levels
- Overall vitality

**Why We Use It:** This traditional botanical has been researched for its potential to support male wellness naturally.

## Key Ingredients in Genie for Her

Our female-focused formula is specially designed to support women's unique wellness needs.

### Damiana Leaf (Turnera diffusa)

**What it is:** A small shrub native to Central and South America, traditionally used to support female wellness.

**The Science:** Traditional use and modern research suggest Damiana may help with:
- Female libido and desire
- Mood and emotional wellness
- Overall vitality

**Why We Use It:** Damiana has a long history of traditional use for supporting women's wellness and intimacy.

### Red Clover (Trifolium pratense)

**What it is:** A wild plant in the legume family, rich in isoflavones.

**The Science:** Research indicates Red Clover may support:
- Hormonal balance
- Cardiovascular health
- Bone health

**Why We Use It:** The isoflavones in Red Clover can support natural hormonal balance, which is important for overall wellness.

### Ginkgo Biloba

**What it is:** One of the oldest tree species on Earth, used in traditional Chinese medicine for thousands of years.

**The Science:** Studies suggest Ginkgo may support:
- Circulation and blood flow
- Cognitive function
- Antioxidant activity

**Why We Use It:** Proper circulation is essential for sexual wellness, and Ginkgo is well-researched for its circulation-supporting properties.

## How Our Formulas Work Together

Our ingredients aren't just thrown together—they're carefully formulated to work synergistically:

1. **Support the stress response** - Ingredients like Ashwagandha help manage stress
2. **Support circulation** - Ginkgo and other botanicals support healthy blood flow
3. **Support hormonal balance** - Selected ingredients support natural hormone production
4. **Provide essential nutrients** - Vitamins and minerals fill nutritional gaps

## Safety and Quality Standards

We take safety seriously. Every batch of Genie is:

- Manufactured in FDA-registered facilities
- Tested for purity and potency
- Free from harmful additives
- Made with natural, non-GMO ingredients

## Understanding the Timeline

Natural supplements work differently than pharmaceutical products. Here's what to expect:

- **Week 1-2:** You may notice subtle changes in energy and mood
- **Week 2-4:** More noticeable effects on vitality and responsiveness
- **Month 2+:** Optimal results as your body adapts to the natural ingredients

Remember: Individual results vary, and supplements work best when combined with a healthy lifestyle.

## Frequently Asked Questions

### Are your ingredients scientifically proven?

Yes. All our ingredients have been studied for their traditional uses and many have modern research supporting their potential benefits. We're transparent about what the science says—and what it doesn't say yet.

### Are there any side effects?

Our natural formulations are generally well-tolerated. However, if you have medical conditions or take medications, we recommend consulting with your healthcare provider.

### Can I take Genie with other supplements?

Generally yes, but we recommend checking with your healthcare provider, especially if you're taking prescription medications.

## The Bottom Line

We believe in empowering you with knowledge. The science behind Genie combines traditional wisdom with modern research to create safe, effective formulations you can trust.

Want to learn more? Visit our [Science page](/science) for detailed ingredient information and links to research studies.

---

**Ready to experience the difference?** Try Genie for yourself and feel the natural support your body deserves.`,
    excerpt: 'We believe in transparency. Discover the science-backed natural ingredients in Genie and how they work together to support your wellness and vitality.',
    status: 'published',
    publishedAt: new Date('2024-11-20')
  }
];

async function migrateBlogPosts() {
  try {
    console.log('Starting blog post migration...');

    // First, find an admin user to be the author
    const adminUser = await prisma.user.findFirst({
      where: {
        role: {
          in: ['admin', 'super_admin']
        }
      }
    });

    if (!adminUser) {
      console.error('No admin user found. Please create an admin user first.');
      return;
    }

    console.log(`Using admin user: ${adminUser.email} as author`);

    // Create blog posts
    for (const postData of blogPosts) {
      console.log(`Creating blog post: ${postData.title}`);
      
      // Check if post already exists
      const existingPost = await prisma.blogPost.findUnique({
        where: { slug: postData.slug }
      });

      if (existingPost) {
        console.log(`Post with slug "${postData.slug}" already exists. Skipping...`);
        continue;
      }

      const post = await prisma.blogPost.create({
        data: {
          ...postData,
          authorId: adminUser.id
        }
      });

      console.log(`✓ Created post: ${post.title} (ID: ${post.id})`);
    }

    console.log('Blog post migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateBlogPosts();