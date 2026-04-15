const emailjs = {
  send: jest.fn().mockResolvedValue({ status: 200, text: "OK" }),
  init: jest.fn(),
};
export default emailjs;
