import AppError from "../../errors/AppError";
import Tag from "../../models/Tag";

const GetAllTags = async (companyId: string | number) => {
  const tags = await Tag.findAll({
    where: {  companyId }
  });

  if (!tags) {
    throw new AppError("ERR_NO_TAG_FOUND", 404);
  }

  return tags;
};

export default GetAllTags;
