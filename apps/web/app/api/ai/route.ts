import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth"; // Adjust to your actual auth.ts path
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, currentContent, selectedText } = await req.json();

    // Context determines if the AI runs on the whole note or a specific highlight
    const textToProcess = selectedText || currentContent;

    if (!textToProcess && action !== "tldr") {
      return NextResponse.json({ error: "No content provided to process" }, { status: 400 });
    }

    // Dynamic system instructions tailored to your 4 discussed features
    let systemInstruction = 
      "You are an expert writing assistant inside LexiDraft, a modern rich-text note application. " +
      "CRITICAL RULES:\n" +
      "1. Do NOT use markdown syntax. Do NOT use asterisks (**) for bolding, or hashes (#) for headers.\n" +
      "2. You MUST use clean, standard HTML tags exclusively for formatting. Use <p> for paragraphs, <strong> for bold text, <em> for italics, <ul> and <li> for lists, and <h3> for subheadings.\n" +
      "3. Output your response directly as the raw text/HTML structure. Do NOT wrap your response in markdown code blocks (such as ```html ... ```).";

    if (action === "polish") {
      systemInstruction += " Task: Polish & Refine. Fix all grammar mistakes, improve sentence flow, and adopt a clean, professional tone while strictly preserving the original meaning. Do not add completely new ideas.";
    } else if (action === "expand") {
      systemInstruction += " Task: Expand & Elaborate. Take the provided brief bullet points, phrases, or short sentences and expand them into a well-explained, structured paragraph or set of clean paragraphs.";
    } else if (action === "reference") {
        systemInstruction += ` Task: Add References & Context. 
            Analyze the text and generate a clean HTML block titled '🔍 References & Technical Context'.
            Provide high-quality technical definitions and core concepts mentioned in the note.
            
            CRITICAL LINK GUIDELINES:
            - You must embed clickable reference links using standard HTML anchor tags: <a href="URL">Name</a>
            - NEVER invent or make up a deep article URL.
            - If referencing a general technical topic, provide a clean Google Search query link, formatted exactly like: https://www.google.com/search?q=your+search+term
            - If referencing a major tool or framework, link directly to its official documentation homepage (e.g., https://nextjs.org/docs, https://www.prisma.io/docs, https://developer.mozilla.org).
            - Format the response as standard web paragraphs and bullet points so it integrates into a rich-text canvas seamlessly.`;
    } else if (action === "tldr") {
      systemInstruction += " Task: Generate TL;DR. Read the entire note context and generate a high-impact, crisp 2-sentence summary. Keep it brief and descriptive.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        { role: "user", parts: [{ text: `Content:\n${textToProcess}` }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: action === "polish" ? 0.3 : 0.7, // Lower temperature for polishing to keep exact meaning
      }
    });

    return NextResponse.json({ text: response.text }, { status: 200 });
  } catch (error) {
    console.error("AI Assistant API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}