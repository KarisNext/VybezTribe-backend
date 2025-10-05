const express = require('express');
const router = express.Router();

const { getPool } = require('../../config/db');

router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    
    const {
      active = 'true',
      sort = 'order_index',
      order = 'ASC'
    } = req.query;

    let whereConditions = [];
    let queryParams = [];

    if (active !== 'all') {
      whereConditions.push('active = $1');
      queryParams.push(active === 'true');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const allowedSortColumns = ['order_index', 'name', 'created_at'];
    const sortColumn = allowedSortColumns.includes(sort) ? sort : 'order_index';
    const sortOrder = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const categoriesQuery = `
      SELECT 
        category_id,
        name,
        slug,
        description,
        color,
        icon,
        order_index,
        active,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM news WHERE category_id = c.category_id AND status = 'published') as news_count
      FROM categories c
      ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
    `;

    const result = await pool.query(categoriesQuery, queryParams);

    return res.json({
      success: true,
      categories: result.rows
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const pool = getPool();
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const sort = req.query.sort || 'published_at';
    const order = req.query.order || 'DESC';

    const categoryResult = await pool.query(
      'SELECT category_id, name FROM categories WHERE slug = $1 AND active = true',
      [slug]
    );
    
    if (categoryResult.rowCount === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Category not found' 
      });
    }
    
    const categoryId = categoryResult.rows[0].category_id;
    const categoryName = categoryResult.rows[0].name;

    const newsQuery = `
      SELECT 
        n.*,
        a.first_name,
        a.last_name,
        c.name as category_name,
        c.slug as category_slug
      FROM news n
      INNER JOIN authors a ON n.author_id = a.author_id
      INNER JOIN categories c ON n.category_id = c.category_id
      WHERE n.category_id = $1 AND n.status = 'published'
      ORDER BY n.${sort} ${order}
      OFFSET $2 LIMIT $3
    `;
    
    const newsResult = await pool.query(newsQuery, [categoryId, offset, limit]);

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM news WHERE category_id = $1 AND status = $2',
      [categoryId, 'published']
    );
    
    const totalArticles = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalArticles / limit);

    return res.json({
      success: true,
      category: {
        name: categoryName,
        slug: slug,
        total_articles: totalArticles
      },
      news: newsResult.rows,
      pagination: {
        page: page,
        limit: limit,
        total: totalArticles,
        totalPages: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error(`Error fetching news for category ${req.params.slug}:`, error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    const categoryQuery = `
      SELECT 
        category_id,
        name,
        slug,
        description,
        color,
        icon,
        order_index,
        active,
        created_at,
        updated_at,
        (SELECT COUNT(*) FROM news WHERE category_id = c.category_id AND status = 'published') as news_count
      FROM categories c
      WHERE category_id = $1
    `;

    const result = await pool.query(categoryQuery, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    return res.json({
      success: true,
      category: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching category:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const pool = getPool();
    
    const {
      name,
      slug,
      description,
      color,
      icon,
      order_index = 0,
      active = true,
      admin_id
    } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: 'Name and slug are required'
      });
    }

    const existingSlug = await pool.query(
      'SELECT category_id FROM categories WHERE slug = $1',
      [slug]
    );

    if (existingSlug.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Category slug already exists'
      });
    }

    const categoryQuery = `
      INSERT INTO categories (
        name, slug, description, color, icon, order_index, active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      ) RETURNING *
    `;

    const result = await pool.query(categoryQuery, [
      name,
      slug,
      description,
      color,
      icon,
      parseInt(order_index),
      active
    ]);

    if (admin_id) {
      await pool.query(
        'INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          admin_id,
          'create_category',
          'category',
          result.rows[0].category_id,
          `Created category: ${name}`,
          req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip
        ]
      );
    }

    return res.json({
      success: true,
      message: 'Category created successfully',
      category: result.rows[0]
    });

  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Category with this slug already exists'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    const {
      name,
      slug,
      description,
      color,
      icon,
      order_index,
      active,
      admin_id
    } = req.body;

    const existingCategory = await pool.query(
      'SELECT * FROM categories WHERE category_id = $1',
      [id]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    if (slug) {
      const slugCheck = await pool.query(
        'SELECT category_id FROM categories WHERE slug = $1 AND category_id != $2',
        [slug, id]
      );

      if (slugCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Category slug already exists'
        });
      }
    }

    let updateFields = [];
    let updateValues = [];
    let paramCount = 0;

    if (name !== undefined) {
      paramCount++;
      updateFields.push(`name = $${paramCount}`);
      updateValues.push(name);
    }

    if (slug !== undefined) {
      paramCount++;
      updateFields.push(`slug = $${paramCount}`);
      updateValues.push(slug);
    }

    if (description !== undefined) {
      paramCount++;
      updateFields.push(`description = $${paramCount}`);
      updateValues.push(description);
    }

    if (color !== undefined) {
      paramCount++;
      updateFields.push(`color = $${paramCount}`);
      updateValues.push(color);
    }

    if (icon !== undefined) {
      paramCount++;
      updateFields.push(`icon = $${paramCount}`);
      updateValues.push(icon);
    }

    if (order_index !== undefined) {
      paramCount++;
      updateFields.push(`order_index = $${paramCount}`);
      updateValues.push(parseInt(order_index));
    }

    if (active !== undefined) {
      paramCount++;
      updateFields.push(`active = $${paramCount}`);
      updateValues.push(active);
    }

    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date());

    paramCount++;
    updateValues.push(id);

    if (updateFields.length === 1) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const updateQuery = `
      UPDATE categories 
      SET ${updateFields.join(', ')}
      WHERE category_id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, updateValues);

    if (admin_id) {
      await pool.query(
        'INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          admin_id,
          'update_category',
          'category',
          id,
          `Updated category: ${name || existingCategory.rows[0].name}`,
          req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip
        ]
      );
    }

    return res.json({
      success: true,
      message: 'Category updated successfully',
      category: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Category with this slug already exists'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const { admin_id } = req.body;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID format'
      });
    }

    const existingCategory = await pool.query(
      'SELECT * FROM categories WHERE category_id = $1',
      [id]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const newsCheck = await pool.query(
      'SELECT COUNT(*) as count FROM news WHERE category_id = $1',
      [id]
    );

    if (parseInt(newsCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with associated news articles. Please reassign or delete the news first.'
      });
    }

    await pool.query('DELETE FROM categories WHERE category_id = $1', [id]);

    if (admin_id) {
      await pool.query(
        'INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
        [
          admin_id,
          'delete_category',
          'category',
          id,
          `Deleted category: ${existingCategory.rows[0].name}`,
          req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.ip
        ]
      );
    }

    return res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;