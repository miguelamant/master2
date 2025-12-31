import * as service from '../services/auth.service.js';

export async function registerBusiness(req, res, next) {
    try {
        const result = await service.registerBusiness(req.body);
        res.json(result);
    } catch (err) { next(err); }
}

export async function login(req, res, next) {
    try {
        const result = await service.login(req, res);
        res.json(result);
    } catch (err) { next(err); }
}

export async function getUser(req, res) {
    res.json({ user: req.session.user });
}
