class Box<T> {
    #value: T | undefined;
  
    constructor(value: T) {
      this.#value = value;
    }
  
    get(): T {
      if (this.#value !== undefined) return this.#value;
      throw new Error('Moved or dropped');
    }
  
    move(): Box<T> {
      const val = this.get();
      this.#value = undefined;
      return new Box<T>(val);
    }
  
    [Symbol.dispose](): void {
      this.#value = undefined;
    }
  }
  
  type TraitImpl<TArgs extends any[] = any[], TResult = any> = (...args: TArgs) => TResult;
  
  class Trait<TArgs extends any[] = any[], TResult = any> {
    private static registry: Map<string, Trait<any, any>> = new Map();
    private implementations: WeakMap<object, TraitImpl<TArgs, TResult>> = new WeakMap();
    public readonly name: string;
  
    constructor(name: string) {
      this.name = name;
      Trait.registry.set(name, this);
    }
  
    static for<TArgs extends any[] = any[], TResult = any>(name: string): Trait<TArgs, TResult> {
      return (Trait.registry.get(name) as Trait<TArgs, TResult>) || new Trait<TArgs, TResult>(name);
    }
  
    implement(target: object, callable: TraitImpl<TArgs, TResult>): void {
      if (typeof target !== 'object') {
        throw new TypeError(`Target is not Object`);
      }
      if (typeof callable !== 'function') {
        throw new TypeError(`Callable is not Function`);
      }
      this.implementations.set(target, callable);
    }
  
    invoke(box: Box<object>, ...args: TArgs): TResult {
      const target = box.get();
      const callable = this.implementations.get(target);
      if (callable === undefined) {
        throw new Error(`Trait not implementemented: ${this.name}`);
      }
      return callable(...args);
    }
  }
  
  const Clonable = Trait.for<[], Box<object>>('Clonable');
  const Movable = Trait.for<[d: { x: number; y: number }], Box<object>>('Movable');
  const Serializable = Trait.for<[], string>('Serializable');
  
  const createPoint = (x: number, y: number): Box<object> => {
    const point = new Box({ x, y });
    const self = Object.create(null);
  
    Clonable.implement(self, () => {
      const { x, y } = point.get();
      return createPoint(x, y);
    });
  
    Movable.implement(self, (d: { x: number; y: number }) => {
      const p = point.get();
      return createPoint(p.x + d.x, p.y + d.y);
    });
  
    Serializable.implement(self, () => {
      const { x, y } = point.get();
      return `(${x}, ${y})`;
    });
  
    return new Box(self);
  };
  
  const main = (): void => {
    using p1 = createPoint(10, 20);
    console.log(Serializable.invoke(p1));
    using c0 = Clonable.invoke(p1);
    console.log(Serializable.invoke(c0));
    using c1 = Movable.invoke(c0, { x: -5, y: 10 });
    console.log(Serializable.invoke(c1));
  };
  
  main(); 
