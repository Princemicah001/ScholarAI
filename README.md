# Cognify - Your AI-Powered Study Partner

Cognify is a modern web application designed to revolutionize the way you learn. By leveraging the power of generative AI, Cognify transforms your existing study materials—be it from documents, web pages, or raw text—into a suite of powerful learning tools. Create dynamic study guides, generate custom assessments, and track your progress, all in one place.

## ✨ Key Features

-   **Multi-Source Content Extraction**: Upload PDFs, Word documents, images, paste text, or simply provide a URL. Cognify's AI extracts the core content for you.
-   **AI-Generated Study Guides**: Automatically create comprehensive study guides that include summaries, key points, definitions, and explained concepts to focus your learning.
-   **Custom AI Assessments**: Test your knowledge by generating customized quizzes with a variety of question types, including multiple choice, short answer, flashcards, and even in-depth essays.
-   **Intelligent Performance Evaluation**: Receive detailed feedback on your test performance, including an overall score, analysis of strengths and weaknesses, and specific recommendations for improvement. For essays, get granular feedback with text highlighting and alternative ways to structure your answer.
-   **Personalized Dashboard**: Track your learning journey with an overview of your created sources, average test scores, and recent activity.
-   **Secure & Scalable**: Built on Firebase, ensuring your data is secure and the application is scalable and performant.
-   **Responsive Design**: A seamless experience whether you're on a desktop or a mobile device.

## 🚀 Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **Generative AI**: [Google's Gemini via Genkit](https://firebase.google.com/docs/genkit)
-   **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication, Firestore)
-   **Form Management**: [React Hook Form](https://react-hook-form.com/)
-   **Schema Validation**: [Zod](https://zod.dev/)

## 🏁 Getting Started

This project is set up to run within Firebase Studio, which handles the environment setup and configuration.

### Prerequisites

-   A Firebase project with Firestore and Firebase Authentication enabled.
-   An API key for Google's Generative AI (Gemini).

### Running the Application

1.  **Clone the repository (if applicable):**
    ```bash
    git clone [your-repo-url]
    cd [your-repo-name]
    ```

2.  **Install dependencies:**
    The project is configured to work within an environment where dependencies are managed automatically. If running locally, you would use:
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add your Google AI API key:
    ```
    GEMINI_API_KEY=your_google_ai_api_key_here
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:9002` (or your configured port).

## 📄 Project Structure

-   `src/app/`: Core application routes using the Next.js App Router.
-   `src/components/`: Reusable React components, including UI components from ShadCN.
-   `src/firebase/`: Firebase configuration, providers, and custom hooks (`useUser`, `useCollection`, `useDoc`).
-   `src/ai/`: Contains all Genkit-related logic.
    -   `src/ai/flows/`: Server-side Genkit flows that orchestrate calls to the AI model.
-   `src/lib/`: Shared utilities, server actions (`actions.ts`), and schemas (`schemas.ts`).
-   `firestore.rules`: Security rules for the Firestore database.
-   `docs/backend.json`: A blueprint of the app's data structures and Firebase usage.

---

Built with ❤️ in Firebase Studio.
