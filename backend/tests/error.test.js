import request from "supertest";
import app from "../src/app.js";

describe("Error API", () => {

  it("should log error successfully", async () => {
    const res = await request(app)
      .post("/api/errors")
      .send({
        error: "Test error",
        stack: "stack trace",
        service: "test-service"
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("should fail if error is missing", async () => {
    const res = await request(app)
      .post("/api/errors")
      .send({
        stack: "stack trace",
        service: "test-service"
      });

    expect(res.status).toBe(400);
  });

});