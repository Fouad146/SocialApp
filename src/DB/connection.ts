import { connect } from "mongoose";

export const connectionDB = async()=>{
  await connect(process.env.URI as string)
  .then(() => {
    console.log("DataBase is Connected ✌️ ❤️");
  })
  .catch(() => {
    console.log("Fail to connect DataBase🤬 💔");
  });

}
//   export default connection