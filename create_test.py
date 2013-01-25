#!/usr/bin/python
# Copyright 2012 Google Inc.  All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License"); you may not
# use this file except in compliance with the License.  You may obtain a copy
# of the License at: http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software distrib-
# uted under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES
# OR CONDITIONS OF ANY KIND, either express or implied.  See the License for
# specific language governing permissions and limitations under the License.

"""Tests for create.py."""

__author__ = 'kpy@google.com (Ka-Ping Yee)'

import create
import model
import test_utils


class CreateTest(test_utils.BaseTest):
  """Tests for create.py."""

  def testCreate(self):
    # Grant MAP_CREATOR permission to google.com.
    model.SetGlobalRoles('google.com', [model.Role.MAP_CREATOR])
    # foo@google.com should be able to create a map.
    test_utils.SetUser('foo@google.com')
    handler = test_utils.SetupHandler('/create', create.Create(), '')
    handler.post()
    # Confirm that a map was created.
    location = handler.response.headers['Location']
    map_object = model.Map.Get(location.split('/')[-1])
    self.assertTrue(map_object is not None)
    self.assertTrue('Untitled' in map_object.GetCurrentJson())

  def testCreateWithoutPermission(self):
    # Without MAP_CREATOR, foo@google.com shouldn't be able to create a map.
    test_utils.SetUser('foo@google.com')
    handler = test_utils.SetupHandler('/create', create.Create())
    self.assertRaises(model.AuthorizationError, handler.post)

  def testDomainRole(self):
    # Grant MAP_CREATOR permission to foo@xyz.com.
    model.SetGlobalRoles('foo@xyz.com', [model.Role.MAP_CREATOR])
    # foo@xyz.com should be able to create a map.
    test_utils.SetUser('foo@xyz.com')
    handler = test_utils.SetupHandler('/create', create.Create(), '')
    handler.post()
    location = handler.response.headers['Location']
    # Check the map; initial_domain_role is unset so domain_role should be None.
    map_object = model.Map.Get(location.split('/')[-1])
    self.assertTrue(map_object is not None)
    # With no initial_domain_role set, domain_role should be None.
    self.assertEquals(['xyz.com'], map_object.domains)
    self.assertEquals(None, map_object.domain_role)

    # Now set the initial_domain_role for xyz.com.
    model.Config.Set('initial_domain_role:xyz.com', model.Role.MAP_EDITOR)
    # Create another map.
    test_utils.SetUser('foo@xyz.com')
    handler = test_utils.SetupHandler('/create', create.Create(), '')
    handler.post()
    location = handler.response.headers['Location']
    # Check the map; initial_domain_role is set so domain_role should be set.
    map_object = model.Map.Get(location.split('/')[-1])
    self.assertTrue(map_object is not None)
    self.assertEquals(['xyz.com'], map_object.domains)
    self.assertEquals(model.Role.MAP_EDITOR, map_object.domain_role)


if __name__ == '__main__':
  test_utils.main()
