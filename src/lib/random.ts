export const number = () => Math.random();

export const string = () => Math.random().toString(36).split(".")[1]!;
