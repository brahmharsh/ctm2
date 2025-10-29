import { NextResponse } from "next/server";
import { simpleGameStore as gameStore } from "@/core/ludo/index.js";
import { logger } from "@/shared/logging/logger.js";

export async function GET(request, { params }) {
  const { action } = await params;
  const path = action.join("/");

  switch (path) {
    case "state": {
      const state = gameStore.getState();
      logger.debug("Game state retrieved", {
        playerCount: state.players?.length || 0,
        currentPlayerIndex: state.currentPlayerIndex,
      });
      return NextResponse.json({ success: true, data: state });
    }

    default: {
      logger.warn("Invalid GET action", { path });
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }
  }
}

export async function POST(request, { params }) {
  const { action } = await params;
  const path = action.join("/");

  switch (path) {
    case "join": {
      try {
        const { playerId } = await request.json();
        const result = gameStore.join(playerId);

        if (result.success) {
          logger.info("Player joined", {
            playerId,
            color: result.data.player.color,
            totalPlayers: result.data.gameState.players.length,
          });
        } else {
          logger.warn("Player join failed", { playerId, error: result.error });
        }

        return NextResponse.json(result);
      } catch (error) {
        logger.error("Join endpoint error", { error: error.message });
        return NextResponse.json(
          { success: false, error: "Invalid request body" },
          { status: 400 }
        );
      }
    }

    case "leave": {
      try {
        const { playerId } = await request.json();
        const result = gameStore.leave(playerId);

        logger.info("Player left", {
          playerId,
          remainingPlayers: result.data.gameState.players.length,
        });

        return NextResponse.json(result);
      } catch (error) {
        logger.error("Leave endpoint error", { error: error.message });
        return NextResponse.json(
          { success: false, error: "Invalid request body" },
          { status: 400 }
        );
      }
    }

    case "roll": {
      try {
        const { playerId } = await request.json();
        const result = gameStore.roll(playerId);

        if (result.success) {
          logger.info("Dice rolled", {
            playerId,
            dice: result.data.dice,
            newPosition: result.data.newPosition,
            nextPlayer: result.data.nextPlayer,
          });
        } else {
          logger.warn("Dice roll failed", { playerId, error: result.error });
        }

        return NextResponse.json(result);
      } catch (error) {
        logger.error("Roll endpoint error", { error: error.message });
        return NextResponse.json(
          { success: false, error: "Invalid request body" },
          { status: 400 }
        );
      }
    }

    case "reset": {
      const data = gameStore.reset();
      logger.info("Game reset", { playerCount: data.players?.length || 0 });
      return NextResponse.json({ success: true, data });
    }

    case "join/group": {
      try {
        const { playerId, groupId } = await request.json();
        logger.info("Player joined group", { playerId, groupId });

        return NextResponse.json({
          success: true,
          message: `Player ${playerId} joined group ${groupId}`,
        });
      } catch (error) {
        logger.error("Join group endpoint error", { error: error.message });
        return NextResponse.json(
          { success: false, error: "Invalid request body" },
          { status: 400 }
        );
      }
    }

    default: {
      logger.warn("Invalid POST action", { path });
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }
  }
}
