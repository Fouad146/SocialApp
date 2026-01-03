
export class AppErorr extends Error {
  constructor(public message: any, public statusCode?: number) {
    super(message);
  }
}

// export default AppErorr;
