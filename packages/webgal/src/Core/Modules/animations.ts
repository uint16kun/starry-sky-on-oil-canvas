import { ITransform } from '@/store/stageInterface';

export interface IUserAnimation {
  name: string;
  effects: Array<ITransform & { duration: number }>;
}

export class AnimationManager {
  public nextEnterAnimationName: Map<string, string> = new Map();
  public nextExitAnimationName: Map<string, string> = new Map();
  private animations: Array<IUserAnimation> = [];

  public addAnimation(animation: IUserAnimation) {
    this.animations.push(animation);
  }
  public getAnimations() {
    return this.animations;
  }
}
