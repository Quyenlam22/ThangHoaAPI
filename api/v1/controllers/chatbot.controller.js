const mongoose = require("mongoose");
const Chat = require("../models/chatbot.model");
const Product = require("../models/product.model");
const Category = require("../models/category.model");

module.exports.chatbot = async (req, res) => {
  try {
    const { role, text, image } = req.body;
    if (!text?.trim() && !image) {
      return res.status(400).json({ error: "Message required" });
    }

    const categoryCol = Category.collection;

    // 1. Dựng thực đơn chính thức từ DB để dạy chatbot
    const allProducts = await Product.find({ deleted: false, status: "active" }).select("title categoryId price").lean();

    const catalogMap = {};
    for (const p of allProducts) {
      let catTitle = "Chưa rõ";
      if (p.categoryId) {
        let catIdStr = "";
        if (typeof p.categoryId === "string") {
          catIdStr = p.categoryId;
        } else if (p.categoryId.$oid) {
          catIdStr = p.categoryId.$oid;
        } else {
          catIdStr = p.categoryId.toString();
        }

        // Truy vấn trực tiếp từ MongoDB collection để lấy danh mục chính xác
        let categoryDoc = await categoryCol.findOne({ _id: catIdStr });
        if (!categoryDoc) {
          try {
            const objId = new mongoose.Types.ObjectId(catIdStr);
            categoryDoc = await categoryCol.findOne({ _id: objId });
          } catch (e) {}
        }

        if (!categoryDoc) {
          // Dự phòng mapping cũ/mới nếu DB chưa đồng bộ hết
          const oldToNew = {
            "6a492965803731dcd37c44ef": "64a1b2c3d4e5f67890abcdef",
            "6a492965803731dcd37c44f0": "64a1b2c3d4e5f67890abcdeg",
            "6a492965803731dcd37c44f1": "64a1b2c3d4e5f67890abcdeh",
            "6a492965803731dcd37c44f2": "64a1b2c3d4e5f67890abcdei"
          };
          const fallbackId = oldToNew[catIdStr];
          if (fallbackId) {
            categoryDoc = await categoryCol.findOne({ _id: fallbackId });
            if (!categoryDoc) {
              try {
                const objId = new mongoose.Types.ObjectId(fallbackId);
                categoryDoc = await categoryCol.findOne({ _id: objId });
              } catch (e) {}
            }
          }
        }

        if (categoryDoc) {
          catTitle = categoryDoc.title;
        }
      }
      
      if (!catalogMap[catTitle]) {
        catalogMap[catTitle] = [];
      }
      catalogMap[catTitle].push(`${p.title}${p.price ? ` (${p.price.toLocaleString()} đ)` : ""}`);
    }

    const catalogText = Object.entries(catalogMap)
      .map(([catName, list]) => `- Danh mục ${catName}: ${list.join(", ")}`)
      .join("\n");

    let productContext = "";
    const lowerText = text ? text.toLowerCase() : "";

    // Lấy danh mục để kiểm tra tìm kiếm
    const categories = await Category.find({ deleted: false, status: "active" }).select("_id title slug").lean();

    // Check if user is asking about a specific category
    let matchedCategoryId = null;
    for (const cat of categories) {
      const catTitle = cat.title.toLowerCase();
      if (lowerText.includes(catTitle) || (cat.slug && lowerText.includes(cat.slug.replace(/-/g, " ")))) {
        matchedCategoryId = cat._id;
        break;
      }
    }

    let queryConditions = { deleted: false, status: "active" };
    let hasSearch = false;

    if (matchedCategoryId) {
      queryConditions.categoryId = matchedCategoryId;
      hasSearch = true;
    } else {
      // Look for common food keywords in the text
      const foodKeywords = ["cua", "cá", "tôm", "mực", "gà", "vịt", "lợn", "heo", "bạch tuộc", "ốc", "chả", "nem", "dê", "bò", "ếch", "lươn", "trạch", "rô"];
      const detectedKeywords = foodKeywords.filter(k => lowerText.includes(k));
      if (detectedKeywords.length > 0) {
        queryConditions.title = { $regex: new RegExp(detectedKeywords.join("|"), "i") };
        hasSearch = true;
      }
    }

    if (hasSearch) {
      const suggestedProducts = await Product.find(queryConditions)
        .limit(5)
        .select("title avatar slug _id categoryId description price")
        .lean();

      if (suggestedProducts.length > 0) {
        const productsMetadata = [];
        
        for (let i = 0; i < suggestedProducts.length; i++) {
          const p = suggestedProducts[i];
          let catName = "Chưa rõ";
          
          if (p.categoryId) {
            let catIdStr = "";
            if (typeof p.categoryId === "string") {
              catIdStr = p.categoryId;
            } else if (p.categoryId.$oid) {
              catIdStr = p.categoryId.$oid;
            } else {
              catIdStr = p.categoryId.toString();
            }

            // Truy vấn trực tiếp category từ DB bằng raw collection (để tránh Cast to ObjectId của mongoose)
            let categoryDoc = await categoryCol.findOne({ _id: catIdStr });
            if (!categoryDoc) {
              try {
                const objId = new mongoose.Types.ObjectId(catIdStr);
                categoryDoc = await categoryCol.findOne({ _id: objId });
              } catch (e) {}
            }

            if (!categoryDoc) {
              // Tìm kiếm ID ánh xạ tương ứng
              const oldToNew = {
                "6a492965803731dcd37c44ef": "64a1b2c3d4e5f67890abcdef",
                "6a492965803731dcd37c44f0": "64a1b2c3d4e5f67890abcdeg",
                "6a492965803731dcd37c44f1": "64a1b2c3d4e5f67890abcdeh",
                "6a492965803731dcd37c44f2": "64a1b2c3d4e5f67890abcdei"
              };
              const newToOld = {
                "64a1b2c3d4e5f67890abcdef": "6a492965803731dcd37c44ef",
                "64a1b2c3d4e5f67890abcdeg": "6a492965803731dcd37c44f0",
                "64a1b2c3d4e5f67890abcdeh": "6a492965803731dcd37c44f1",
                "64a1b2c3d4e5f67890abcdei": "6a492965803731dcd37c44f2"
              };
              const fallbackId = oldToNew[catIdStr] || newToOld[catIdStr];
              if (fallbackId) {
                categoryDoc = await categoryCol.findOne({ _id: fallbackId });
                if (!categoryDoc) {
                  try {
                    const objId = new mongoose.Types.ObjectId(fallbackId);
                    categoryDoc = await categoryCol.findOne({ _id: objId });
                  } catch (e) {}
                }
              }
            }

            if (categoryDoc) {
              catName = categoryDoc.title;
            }
          }

          productsMetadata.push(JSON.stringify({
            type: "product_link",
            index: i + 1,
            title: p.title,
            avatar: p.avatar,
            categoryName: catName,
            slug: p.slug,
            _id: p._id,
            description: p.description || "",
            price: p.price || 0
          }));
        }

        productContext = `\n[Dữ liệu hệ thống - Metadata]:\n${productsMetadata.join("\n")}`;
      }
    }

    const systemPrompt = `Bạn là Thăng Hoa Banquet AI Assistant - Trợ lý ảo hỗ trợ khách hàng của Nhà hàng Thăng Hoa (chuyên tiệc, buffet, đồ đồng quê, hải sản tươi sống và thực phẩm chế biến sẵn).

[Thực đơn chính thức của Nhà hàng Thăng Hoa]:
${catalogText || "- Đang cập nhật..."}

QUY TẮC BẮT BUỘC:
1. Khi tư vấn, giới thiệu hoặc trả lời khách hàng, bạn CHỈ ĐƯỢC PHÉP gợi ý các món ăn nằm trong [Thực đơn chính thức của Nhà hàng Thăng Hoa] ở trên. Tuyệt đối không tự bịa hoặc giới thiệu các món ăn không có trong thực đơn (Ví dụ: Không được gợi ý tôm hùm Alaska, cua hoàng đế, bào ngư nếu thực đơn ở trên không có).
2. Khi có danh sách món ăn trong [Dữ liệu hệ thống - Metadata] ở dưới, bạn PHẢI liệt kê ĐẦY ĐỦ tất cả các món ăn có trong đó, không được bỏ sót bất kỳ món nào. Với mỗi món ăn được đề xuất trong Metadata, hãy copy nguyên văn dòng JSON (VD: {"type": "product_link", ...}) sang một dòng mới trong câu trả lời của bạn để hệ thống hiển thị dưới dạng thẻ sản phẩm trực quan.
3. Tuyệt đối không được thay đổi nội dung bên trong các dấu ngoặc nhọn {}.
4. Luôn trả lời bằng Tiếng Việt một cách nhiệt tình, thân thiện, lễ phép. Hướng dẫn khách hàng liên hệ Hotline: 0982453072 / 0397109276 hoặc nhắn tin qua Messenger để đặt tiệc/bàn nhanh chóng nếu họ có nhu cầu.
5. Luôn bắt đầu bằng một lời chào/lời dẫn ấm áp và kết thúc bằng một câu hỏi gợi mở thân thiện.`;

    const chatHistory = await Chat.find({})
      .sort({ createdAt: 1 })
      .limit(20)
      .lean();

    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt + productContext }]
      },
      ...chatHistory.map(msg => ({
        role: msg.role === "model" ? "model" : "user",
        parts: [
          ...(msg.text ? [{ text: msg.text }] : []),
          ...(msg.imageUrl ? [{ text: `Image URL: ${msg.imageUrl}` }] : [])
        ]
      })),
      {
        role: role || "user",
        parts: [
          ...(text ? [{ text }] : []),
          ...(image ? [{ text: `Image URL: ${image}` }] : [])
        ]
      }
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      }
    );

    if (!response.ok) {
      const errData = await response.text();
      console.error("Gemini API HTTP error:", response.status, errData);
      return res.status(response.status).json({ error: "Gemini API HTTP error", raw: errData });
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      console.error("Gemini empty reply:", data);
      return res.status(500).json({ error: "Gemini didn't reply", raw: data });
    }

    const content = await Chat.insertMany([
      { role: "user", text, imageUrl: image },
      { role: "model", text: reply }
    ]);

    const count = await Chat.countDocuments();
    if (count > 100) {
      const excess = count - 100;
      const oldMessages = await Chat.find()
        .sort({ createdAt: 1 })
        .limit(excess)
        .select("_id");
      const ids = oldMessages.map(msg => msg._id);
      await Chat.deleteMany({ _id: { $in: ids } });
    }

    res.json(content);
  } catch (error) {
    console.error("Gemini API error:", error);
    res.status(500).json({ error: "Gemini API failed", details: error.message });
  }
};
