module.exports = (passport) => {
    const obj = {
    adminRouter: require("./adminRoutes")(passport),
    baseRouter: require("./baseRoutes")(passport),
    userRouter: require("./userRoutes")(passport)
    }
    return obj;
}