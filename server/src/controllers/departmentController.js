import { Department } from '../models/index.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { logAudit } from '../utils/auditLogger.js';

export async function getDepartments(req, res, next) {
  try {
    const departments = await Department.find({ isActive: true }).populate('headOfDepartment', 'name email');
    return sendSuccess(res, departments, 'Departments retrieved');
  } catch (error) {
    next(error);
  }
}

export async function createDepartment(req, res, next) {
  try {
    const { code, name, description, headOfDepartment } = req.body;
    const existing = await Department.findOne({ code: code.toUpperCase() });
    if (existing) {
      return sendError(res, 'Department with this code already exists.', 400);
    }

    const department = await Department.create({
      code: code.toUpperCase(),
      name,
      description: description || '',
      headOfDepartment: headOfDepartment || null
    });

    await logAudit({
      userId: req.user._id,
      action: 'CREATE_DEPARTMENT',
      entity: 'Department',
      entityId: department._id,
      details: { code: department.code, name: department.name },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDepartment(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, headOfDepartment, isActive } = req.body;

    const department = await Department.findByIdAndUpdate(
      id,
      { name, description, headOfDepartment, isActive },
      { new: true, runValidators: true }
    );

    if (!department) {
      return sendError(res, 'Department not found', 404);
    }

    await logAudit({
      userId: req.user._id,
      action: 'UPDATE_DEPARTMENT',
      entity: 'Department',
      entityId: department._id,
      details: { code: department.code },
      req
    });

    return sendSuccess(res, department, 'Department updated successfully');
  } catch (error) {
    next(error);
  }
}
