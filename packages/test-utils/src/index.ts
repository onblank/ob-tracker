import type { Clock, IdGenerator } from '@obt/contracts';
export class FakeClock implements Clock {
  public constructor(private current:Date, private monotonic=0) {}
  public now():Date{return new Date(this.current);}
  public monotonicMilliseconds():number{return this.monotonic;}
  public set(date:Date,monotonicMilliseconds=this.monotonic):void{this.current=new Date(date);this.monotonic=monotonicMilliseconds;}
}
export class DeterministicIdGenerator implements IdGenerator {
  private value=0;
  public generate():string{this.value+=1;return `00000000-0000-4000-8000-${this.value.toString().padStart(12,'0')}`;}
}
