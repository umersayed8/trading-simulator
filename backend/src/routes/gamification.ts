import { Router, Response } from "express";
import {
    authenticate,
    optionalAuth,
    AuthenticatedRequest,
} from "../middleware/auth";
import * as Achievement from "../models/Achievement";
import * as GamificationEngine from "../services/gamificationEngine";
import { successResponse, errorResponse } from "../utils/helpers";

const router = Router();

// Get gamification profile
router.get(
    "/profile",
    authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const profile = await GamificationEngine.getProfile(
                req.user!.userId,
            );

            if (!profile) {
                res.status(404).json(
                    errorResponse("NOT_FOUND", "Profile not found"),
                );
                return;
            }

            res.json(successResponse(profile));
        } catch (error) {
            console.error("Get profile error:", error);
            res.status(500).json(
                errorResponse("SERVER_ERROR", "Failed to get profile"),
            );
        }
    },
);

// Get achievements
router.get(
    "/achievements",
    authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const achievements = await Achievement.getUserAchievements(
                req.user!.userId,
            );
            res.json(successResponse(achievements));
        } catch (error) {
            console.error("Get achievements error:", error);
            res.status(500).json(
                errorResponse("SERVER_ERROR", "Failed to get achievements"),
            );
        }
    },
);

// Get daily challenges
router.get(
    "/challenges",
    authenticate,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const today = new Date().toISOString().split("T")[0];
            const challenges = await Achievement.getUserChallenges(
                req.user!.userId,
                today,
            );

            res.json(
                successResponse({
                    daily: challenges,
                    resetsAt:
                        GamificationEngine.getChallengeResetTime().toISOString(),
                }),
            );
        } catch (error) {
            console.error("Get challenges error:", error);
            res.status(500).json(
                errorResponse("SERVER_ERROR", "Failed to get challenges"),
            );
        }
    },
);

// Get leaderboard
router.get(
    "/leaderboard",
    optionalAuth,
    async (req: AuthenticatedRequest, res: Response) => {
        try {
            const period = (req.query.period as string) || "weekly";
            const limit = parseInt(req.query.limit as string) || 50;

            const validPeriods = ["weekly", "monthly", "alltime"];
            if (!validPeriods.includes(period)) {
                res.status(400).json(
                    errorResponse("VALIDATION_ERROR", "Invalid period"),
                );
                return;
            }

            const result = await GamificationEngine.getLeaderboard(
                period as "weekly" | "monthly" | "alltime",
                limit,
            );

            // Add user's rank if authenticated
            let userRank = null;
            if (req.user) {
                const profile = await GamificationEngine.getProfile(
                    req.user.userId,
                );
                if (profile) {
                    const userInList = result.rankings.find(
                        (r) => r.userId === req.user!.userId,
                    );
                    userRank = {
                        rank: profile.rank,
                        portfolioValue: userInList?.portfolioValue || 100000,
                        pnlPercent: userInList?.pnlPercent || 0,
                    };
                }
            }

            console.log(result);

            res.json(
                successResponse({
                    ...result,
                    userRank,
                }),
            );
        } catch (error) {
            console.error("Get leaderboard error:", error);
            res.status(500).json(
                errorResponse("SERVER_ERROR", "Failed to get leaderboard"),
            );
        }
    },
);

export default router;
