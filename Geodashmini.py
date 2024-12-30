from OpenGL.GL import *
from OpenGL.GLUT import *
import random

# Window dimensions
W_Width, W_Height = 800, 600

# Platform dimensions
ground_y = 200
ceiling_y = 400
block_width = 80  # Enlarged width
block_height = 50  # Enlarged height
triangle_base = 80  # Enlarged base
triangle_height = 60  # Enlarged height
block_speed = 0.09  # Initial speed
speed_increment = 0.00001  # Incremental speed increase per frame
max_speed = 0.1  # Maximum allowed speed

# Minimum gap between blocks/triangles
min_gap = 120

# Block and triangle limits
max_blocks = 2
max_triangles = 2

# List to store blocks and triangles
blocks = []
triangles = []

def draw_point(x, y):
    """Draw a single point."""
    glBegin(GL_POINTS)
    glVertex2f(x, y)
    glEnd()


# MCL algorithm for circles
def mcl(x0, y0, r):
    x, y = 0, r
    d = 1 - r

    draw_point(x + x0, y + y0)

    while x <= y:
        de = ((2 * x) + 3)
        dne = ((2 * x) - (2 * y) + 5)

        if d < 0:
            d += de
            x += 1
        else:
            d += dne
            x += 1
            y -= 1

        draw_point(x + x0, y + y0)
        draw_point(-x + x0, y + y0)
        draw_point(-x + x0, -y + y0)
        draw_point(x + x0, -y + y0)
        draw_point(y + x0, x + y0)
        draw_point(-y + x0, x + y0)
        draw_point(-y + x0, -x + y0)
        draw_point(y + x0, -x + y0)


# MPL algorithm for lines
def mpl(x0, y0, x1, y1):
    zone = findzone(x0, y0, x1, y1)
    x0, y0 = converttozone0(zone, x0, y0)
    x1, y1 = converttozone0(zone, x1, y1)

    dx = x1 - x0
    dy = y1 - y0

    dne = 2 * dy - 2 * dx
    de = 2 * dy

    dinit = 2 * dy - dx

    while x0 <= x1:
        if dinit >= 0:
            dinit += dne
            x0 += 1
            y0 += 1
        else:
            dinit += de
            x0 += 1

        a, b = converttozoneM(zone, x0, y0)
        draw_point(a, b)


# Zone conversion algorithms
def findzone(x0, y0, x1, y1):
    dx = x1 - x0
    dy = y1 - y0

    if abs(dx) > abs(dy):
        if dx >= 0 and dy >= 0:
            return 0
        elif dx < 0 and dy >= 0:
            return 3
        elif dx < 0 and dy < 0:
            return 4
        else:
            return 7
    else:
        if dx >= 0 and dy >= 0:
            return 1
        elif dx < 0 and dy >= 0:
            return 2
        elif dx < 0 and dy < 0:
            return 5
        else:
            return 6


def converttozone0(zone, x, y):
    if zone == 0:
        return x, y
    elif zone == 1:
        return y, x
    elif zone == 2:
        return y, -x
    elif zone == 3:
        return -x, y
    elif zone == 4:
        return -x, -y
    elif zone == 5:
        return -y, -x
    elif zone == 6:
        return -y, x
    elif zone == 7:
        return x, -y


def converttozoneM(zone, x, y):
    if zone == 0:
        return x, y
    elif zone == 1:
        return y, x
    elif zone == 2:
        return -y, x
    elif zone == 3:
        return -x, y
    elif zone == 4:
        return -x, -y
    elif zone == 5:
        return -y, -x
    elif zone == 6:
        return y, -x
    elif zone == 7:
        return x, -y

class Block:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = block_width
        self.height = block_height

    def move(self):
        self.x -= block_speed

    def is_outside(self):
        return self.x + self.width < 0

    def draw(self):
        # Draw block as a rectangle using MPL
        mpl(self.x, self.y, self.x + self.width, self.y)
        mpl(self.x + self.width, self.y, self.x + self.width, self.y + self.height)
        mpl(self.x + self.width, self.y + self.height, self.x, self.y + self.height)
        mpl(self.x, self.y + self.height, self.x, self.y)


    def draw_glow(self):
        # Draw multiple transparent layers to simulate a glow effect
        for i in range(1, 9):  # Increase the range for a larger glow
            alpha = 0.1 * (9 - i)  # Decrease alpha for outer layers
            scale = 1.0 + 0.5 * i  # Increase size for outer layers
            glColor4f(0.8, 0.2, 0.8, alpha)  # Pinkish glow with transparency

            # Calculate scaled coordinates
            left = self.x - scale
            right = self.x + self.width + scale
            bottom = self.y - scale
            top = self.y + self.height + scale

            # Use MPL to draw the scaled rectangle as an outline
            mpl(left, bottom, right, bottom)  # Bottom edge
            mpl(right, bottom, right, top)    # Right edge
            mpl(right, top, left, top)        # Top edge
            mpl(left, top, left, bottom)      # Left edge




class Triangle:
    def __init__(self, x, y, base, height, flipped=False):
        self.x = x
        self.y = y
        self.base = base
        self.height = height
        self.flipped = flipped

    def move(self):
        self.x -= block_speed

    def is_outside(self):
        return self.x + self.base < 0

    def draw(self):
        # Draw triangle using MPL
        if self.flipped:
            mpl(self.x, self.y, self.x + self.base / 2, self.y - self.height)
            mpl(self.x + self.base / 2, self.y - self.height, self.x + self.base, self.y)
            mpl(self.x + self.base, self.y, self.x, self.y)
        else:
            mpl(self.x, self.y, self.x + self.base / 2, self.y + self.height)
            mpl(self.x + self.base / 2, self.y + self.height, self.x + self.base, self.y)
            mpl(self.x + self.base, self.y, self.x, self.y)

    def draw_glow(self):
        # Draw multiple transparent layers to simulate a glow effect
        for i in range(1, 9):  # Increase the range for a larger glow
            alpha = 0.1 * (9 - i)  # Decrease alpha for outer layers
            scale = 1.0 + 0.5 * i  # Increase size for outer layers
            glColor4f(0.8, 0.2, 0.8, alpha)  # Pinkish glow with transparency

            # Calculate scaled coordinates
            left = self.x - scale
            right = self.x + self.width + scale
            bottom = self.y - scale
            top = self.y + self.height + scale

            # Use MPL to draw the scaled rectangle as an outline
            mpl(left, bottom, right, bottom)  # Bottom edge
            mpl(right, bottom, right, top)    # Right edge
            mpl(right, top, left, top)        # Top edge
            mpl(left, top, left, bottom)      # Left edge



def check_gap(new_x, existing_objects, width):
    """Ensure there is a minimum gap between objects."""
    for obj in existing_objects:
        if abs(new_x - obj.x) < min_gap:
            return False
    return True

def create_blocks():
    global blocks
    blocks = []
    x_positions = list(range(W_Width, W_Width + 400, min_gap + block_width))
    random.shuffle(x_positions)
    for x in x_positions[:max_blocks]:
        if check_gap(x, blocks + triangles, block_width):
            blocks.append(Block(x, ground_y))

def create_triangles():
    global triangles
    triangles = []
    x_positions = list(range(W_Width, W_Width + 400, min_gap + triangle_base))
    random.shuffle(x_positions)
    for x in x_positions[:max_triangles]:
        if check_gap(x, blocks + triangles, triangle_base):
            if random.choice([True, False]):
                triangles.append(Triangle(x, ground_y, triangle_base, triangle_height))  # Triangle on ground
            else:
                triangles.append(Triangle(x, ceiling_y, triangle_base, triangle_height, flipped=True))  # Triangle on ceiling

def update_blocks_and_triangles():
    global blocks, triangles

    # Move blocks and triangles
    for block in blocks:
        block.move()
    blocks = [block for block in blocks if not block.is_outside()]

    for triangle in triangles:
        triangle.move()
    triangles = [triangle for triangle in triangles if not triangle.is_outside()]

    # Spawn new blocks and triangles
    if len(blocks) < max_blocks:
        x_positions = list(range(W_Width, W_Width + 400, min_gap + block_width))
        random.shuffle(x_positions)
        for x in x_positions:
            if check_gap(x, blocks + triangles, block_width):
                blocks.append(Block(x, ground_y))
                break

    if len(triangles) < max_triangles:
        x_positions = list(range(W_Width, W_Width + 400, min_gap + triangle_base))
        random.shuffle(x_positions)
        for x in x_positions:
            if check_gap(x, blocks + triangles, triangle_base):
                if random.choice([True, False]):
                    triangles.append(Triangle(x, ground_y, triangle_base, triangle_height))  # Triangle on ground
                else:
                    triangles.append(Triangle(x, ceiling_y, triangle_base, triangle_height, flipped=True))  # Triangle on ceiling
                break

def draw_line(x1, y1, x2, y2):
    glBegin(GL_LINES)
    glVertex2f(x1, y1)
    glVertex2f(x2, y2)
    glEnd()

def draw_platform():
    glColor3f(1.0, 1.0, 1.0)
    draw_line(0, ground_y, W_Width, ground_y)
    draw_line(0, ceiling_y, W_Width, ceiling_y)

def draw_blocks():
    glColor3f(0.5, 0.2, 0.8)  # Block color
    for block in blocks:
        block.draw()

def draw_triangles():
    glColor3f(0.2, 0.8, 0.4)  # Triangle color
    for triangle in triangles:
        triangle.draw()

def display():
    glClear(GL_COLOR_BUFFER_BIT)
    draw_platform()
    draw_blocks()
    draw_triangles()
    glutSwapBuffers()

def animate():
    global block_speed
    update_blocks_and_triangles()

    # Gradually increase the speed, but cap it at max_speed
    if block_speed < max_speed:
        block_speed += speed_increment

    glutPostRedisplay()

def init():
    glClearColor(0.0, 0.0, 0.0, 1.0)
    glMatrixMode(GL_PROJECTION)
    glLoadIdentity()
    glOrtho(0.0, W_Width, 0.0, W_Height, -1.0, 1.0)

    # Enable blending for transparency
    glEnable(GL_BLEND)
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA)





# Initialize the game
create_blocks()
create_triangles()

glutInit()
glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB)
glutInitWindowSize(W_Width, W_Height)
glutCreateWindow(b"Moving Platform Game")
init()
glutDisplayFunc(display)
glutIdleFunc(animate)
glutMainLoop()

