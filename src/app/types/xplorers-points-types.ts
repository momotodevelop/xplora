export interface XplorersPointsTransaction {
    userId: string;
    type: 'add' | 'subtract';
    points: number;
    description?: string;
    timestamp: string;
}