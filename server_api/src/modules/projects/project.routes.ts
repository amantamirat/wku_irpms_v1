import { Router } from 'express';
import { PERMISSIONS } from '../../common/constants/permissions';
import { projectService } from '../../core/container';
import { verifyAuthToken } from '../auth/auth.middleware';
import { checkTransitionPermission } from '../../core/container';
import { checkPermission } from '../../core/container';
import { ProjectController } from './project.controller';
import { upload } from '../../util/multer';

const controller = new ProjectController(projectService);
const router: Router = Router();

//create
router.post('/', verifyAuthToken,
    checkPermission([PERMISSIONS.PROJECT.CREATE, PERMISSIONS.PROJECT.CREATE_OWN]),
    controller.create);


router.post(
    "/apply",
    verifyAuthToken,
    checkPermission("project:apply"),
    (req, res, next) => {
        // Set the dynamic subfolder for this specific endpoint
        req.headers["x-upload-folder"] = "applications";
        next();
    },
    upload.single("file"),
    controller.apply
);


router.get('/', verifyAuthToken,
    checkPermission([PERMISSIONS.PROJECT.READ]),
    controller.get);


//Put the /me route before /:id:
router.get(
    '/me',
    verifyAuthToken,
    controller.getMyProjects
);

// lookup projects
router.get(
    '/lookup',
    verifyAuthToken,
    checkPermission([PERMISSIONS.PROJECT.LOOKUP]),
    controller.lookup
);

router.get('/:id', verifyAuthToken,
    checkPermission([PERMISSIONS.PROJECT.LOOKUP]),
    controller.getById);


//update    
router.put('/:id', verifyAuthToken,
    checkPermission([PERMISSIONS.PROJECT.UPDATE, PERMISSIONS.PROJECT.UPDATE_OWN]),
    controller.update);

//update status
router.patch('/:id', verifyAuthToken,
    checkTransitionPermission("project"),
    controller.transitionState);

//delete
router.delete('/:id', verifyAuthToken,
    checkPermission([PERMISSIONS.PROJECT.DELETE, PERMISSIONS.PROJECT.DELETE_OWN]),
    controller.delete);

export default router;
