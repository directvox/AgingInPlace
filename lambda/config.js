const config = {
    appId :  process.env.APP_ID,
    dbURL :  process.env.DB_HOST,
    dbDatabase : process.env.DB_DATABASE,
    dbUSER :  process.env.DB_USER,
    dbPWD :  process.env.DB_PASS,
    dbPort : 5432
};

module.exports = config;