import { NextRequest, NextResponse } from "next/server";
import { createAuth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Create auth instance
    const auth = await createAuth({
      cranberry_auth_db: {} as any, // This will be handled by the worker
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
      NODE_ENV: process.env.NODE_ENV,
    });

    // Create user with admin role
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        role: "admin", // Set role to admin
      },
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Admin user created successfully",
      user: result.data?.user,
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
