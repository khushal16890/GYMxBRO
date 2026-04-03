import { collection, addDoc } from "firebase/firestore";
import { db } from "../src/firebase.js";

const articles = [
  {
    title: "The Ultimate Guide to Hypertrophy",
    preview: "Discover the science behind muscle growth and how to optimize your training and nutrition.",
    content: "Hypertrophy is the increase and growth of muscle cells. It refers to an increase in muscular size achieved through exercise. When you work out, if you want to tone or improve muscle definition, lifting weights is the most common way to increase hypertrophy.\n\nTo build muscle, you need to challenge the muscle with mechanical tension, muscle damage, and metabolic stress, all of which are achieved by lifting heavy weights.\n\nNutrition plays a crucial role. Aim for 1.6-2.2 grams of protein per kilogram of body weight to support muscle recovery and growth.",
    author: "Khushal",
    tags: ["Strength", "Nutrition", "Beginner"],
    likes: [],
    comments: [],
    createdAt: new Date().toISOString()
  },
  {
    title: "Mastering the Deadlift",
    preview: "Learn the proper technique to perform the deadlift safely and effectively, avoiding common injuries.",
    content: "The deadlift is one of the most effective compound exercises you can do. It works multiple muscle groups simultaneously, including your glutes, hamstrings, back, core, and grip.\n\nHowever, it's also one where poor form can lead to serious injuries. The key is to keep a neutral spine throughout the movement. Start with the bar over your mid-foot, brace your core, pull your shoulders back and down, and drive through the floor with your legs.\n\nAlways warm up properly and start with lighter weights to perfect your form before attempting heavy lifts.",
    author: "Khushal",
    tags: ["Strength", "Mindset"],
    likes: [],
    comments: [],
    createdAt: new Date(Date.now() - 86400000).toISOString() // yesterday
  },
  {
    title: "Cardio for Weightlifters",
    preview: "How to integrate cardiovascular training into your strength routine without losing your gains.",
    content: "A common myth in the fitness community is that doing cardio will destroy your muscle gains. This is simply not true if done correctly.\n\nIn fact, incorporating cardiovascular exercise can improve your heart health, increase your work capacity, and actually help you recover faster between sets.\n\nThe trick is to find the right balance. Low-intensity steady-state (LISS) cardio like walking or cycling is great for active recovery. High-intensity interval training (HIIT) can also be used sparingly to improve conditioning without taking up too much time.",
    author: "GymxBro Team",
    tags: ["Cardio", "Recovery"],
    likes: [],
    comments: [],
    createdAt: new Date(Date.now() - 172800000).toISOString() // 2 days ago
  }
];

async function seed() {
  console.log("Starting to seed editorial articles...");
  const articlesRef = collection(db, "editorial_articles");
  
  for (const article of articles) {
    try {
      const docRef = await addDoc(articlesRef, article);
      console.log(`Successfully added article: ${article.title} with ID: ${docRef.id}`);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
  
  console.log("Seeding complete! You can press Ctrl+C to exit.");
  process.exit(0);
}

seed();
