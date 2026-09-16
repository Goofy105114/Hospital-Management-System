import { NextRequest } from "next/server";
import { QueueService } from "@/server/services/queue.service";
import { apiSuccess } from "@/lib/api-envelope";

export async function GET(req: NextRequest, { params }: { params: { doctorId: string } }) {
  const board = await QueueService.getDoctorQueueBoard(params.doctorId);
  return apiSuccess(board);
}
