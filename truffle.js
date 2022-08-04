module.exports = {
  plugins: [ "truffle-security" ],
  compilers: {
    solc: {
      version: "^0.5.0"
    }
  },
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "5777", // Match any network id
      from: "0x56437D525295A04293aF0dAD98262A62cAac8CcE"
    }
  }
};

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMjAxYzYwYS00ODIyLTQ3NzQtOWIxNi01MWJmYzkwMzZiODYiLCJpYXQiOjE2NDEzNjcxMDEuMzY4LCJpc3MiOiJNeXRoWCBBdXRoIFNlcnZpY2UiLCJleHAiOjE5NTY5NDMxMDEuMzY0LCJ1c2VySWQiOiI2MWQ1NDNhOTFmZDM5MzJiODYxYTMxYjcifQ.WUcaAMsVuBnA4R7UKm4VD7ydp-M3ahj2_V4CYX5UBeg
