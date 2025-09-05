import joi from "joi";

const validateRegistration = (data) => {
  // schema means we just creating a refrence thinngs based on this schema the coming data is valid or not
  const schema = joi.object({
    username: joi.string().min(3).max(50).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
  });
  // this method is automaticalluy validate the data based on the schema
  return schema.validate(data);
};

export default validateRegistration;
