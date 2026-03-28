import { useState } from "react";
import "./Learn.css";

export default function Learn() {
  const blogs = [
    {
      id: 1,
      title: "Introduction to Gym",
      preview:
        "The gym is a structured environment designed to help individuals build strength, improve endurance, and enhance overall physical health. It offers a variety of equipment such as dumbbells, machines, and cardio devices that support different training goals. Beginners often start with basic exercises to learn proper form and avoid injuries. Over time, consistent workouts lead to noticeable improvements in muscle tone, posture, and energy levels. The gym also provides a motivating environment with like-minded individuals striving for fitness. Developing a routine is key to long-term progress.",
      full:
        "The gym is a dedicated space that provides the tools and environment necessary for structured physical training. It includes strength-training equipment like barbells, machines, kettlebells, and benches, along with cardio equipment such as treadmills, cycles, and rowers. The purpose of a gym is to help individuals improve strength, endurance, flexibility, and overall fitness. For beginners, the initial focus is on learning the correct form, understanding muscle groups, and getting comfortable with basic movements. Over time, progressive overload—gradually increasing weight or intensity—helps build muscle and improve performance. The gym also fosters discipline, consistency, and confidence. It creates an atmosphere that encourages growth, making it easier for individuals to stay committed to their fitness goals."
    },
    {
      id: 2,
      title: "Introduction to Nutrition",
      preview:
        "Nutrition is the foundation of a healthy lifestyle and plays a crucial role in fitness progress. Proper nutrition provides the body with the energy and nutrients required for training, recovery, and daily activities. A balanced diet includes proteins, carbohydrates, fats, vitamins, and minerals in the right proportions. Eating whole, unprocessed foods supports better health outcomes. Understanding calorie balance—how much you eat versus how much you burn—is essential for goals like weight loss or muscle gain. Hydration is equally important for performance and recovery.",
      full:
        "Nutrition is one of the most important pillars of fitness and overall well-being. It involves consuming the right balance of macronutrients—proteins, carbohydrates, and fats—along with essential vitamins and minerals. Proper nutrition fuels your workouts, supports muscle recovery, strengthens the immune system, and maintains healthy body function. For fitness goals, understanding calorie balance is crucial: a calorie deficit helps with fat loss, while a calorie surplus supports muscle growth. Whole foods such as vegetables, fruits, lean meats, nuts, and grains provide stable energy and long-term health benefits. Hydration also plays a critical role in performance, digestion, and recovery. Good nutrition combined with exercise leads to sustainable fitness results."
    }
  ];

  const [openBlog, setOpenBlog] = useState(null);

  return (
    <div className="learn-container">
      <h1 className="learn-title">Learn</h1>

      {blogs.map((blog) => (
        <div
          key={blog.id}
          className="blog-card"
          onClick={() => setOpenBlog(openBlog === blog.id ? null : blog.id)}
        >
          <h2 className="blog-title">{blog.title}</h2>
          <p className="blog-text">
            {openBlog === blog.id ? blog.full : blog.preview}
          </p>
          <span className="blog-action">
            {openBlog === blog.id ? "Show Less" : "Read More"}
          </span>
        </div>
      ))}
    </div>
  );
}