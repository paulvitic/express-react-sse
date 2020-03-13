
describe("test", ()=> {
    test("should convert to from string", () => {
        let tzOffset = (new Date()).getTimezoneOffset() * 60000;
        let stringTime = "2019-11-27";
        let date = new Date(stringTime);
        let d = new Date();
        let n = d.getTimezoneOffset();
        let timezone = n / -60;

         //offset in milliseconds
        let localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 19).replace('T', ' ');


        let isOStringTime = date.toISOString();
        let toStringDate = date.toUTCString();
        expect(stringTime).toEqual(isOStringTime);
    })

});
