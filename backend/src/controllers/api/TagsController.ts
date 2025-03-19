import { Request, Response } from "express";
import GetAllTags from "../../services/TagServices/GetAllTagsService";

interface IndexQuery {
    companyId: string | number;
  }
export const index = async (req: Request, res: Response): Promise<Response> => {
    const { companyId } = req.body as IndexQuery;
    const tags = await GetAllTags( companyId );
    return res.status(200).json(tags);
};