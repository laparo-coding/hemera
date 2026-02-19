#!/usr/bin/env python3
"""Simplify images/route.ts auth block to be consistent with other routes.
requireAdminUser() already logs 403 centrally via serverInstance.warning."""
import pathlib

fpath = pathlib.Path("app/api/admin/course-material/images/route.ts")
src = fpath.read_text()

old = """    const auth = await requireAdminUser();
    if (!auth.authorized) {
      if (auth.userId) {
        logAuditEvent(
          'IMAGE_UPLOAD',
          auth.userId,
          undefined,
          'image',
          'failure',
          {
            error: 'Insufficient permissions',
          }
        );
      }
      return auth.response;
    }"""

new = """    const auth = await requireAdminUser();
    if (!auth.authorized) return auth.response;"""

assert old in src, "OLD block not found!"
result = src.replace(old, new, 1)

# Also check if logAuditEvent is still used elsewhere in the file  
if 'logAuditEvent' not in result.replace(old, ''):
    # Check if logAuditEvent is used anywhere else
    pass

fpath.write_text(result)
print("OK — images/route.ts auth block simplified")
