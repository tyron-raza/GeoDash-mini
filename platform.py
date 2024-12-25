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

class Block:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.width = block_width
        self.height = block_height
        self.glow_intensity = 0.0
        self.glow_direction = 1

    def move(self):
        self.x -= block_speed

    def is_outside(self):
        return self.x + self.width < 0

    def draw(self):
        # Update glow intensity
        self.glow_intensity += 0.02 * self.glow_direction
        if self.glow_intensity > 1.0 or self.glow_intensity < 0.0:
            self.glow_direction *= -1

        glColor4f(0.5, 0.2, 0.8, 0.6 + 0.4 * self.glow_intensity)  # Glow effect with alpha blending
        glBegin(GL_QUADS)
        glVertex2f(self.x, self.y)
        glVertex2f(self.x + self.width, self.y)
        glVertex2f(self.x + self.width, self.y + self.height)
        glVertex2f(self.x, self.y + self.height)
        glEnd()

class Triangle:
    def __init__(self, x, y, base, height, flipped=False):
        self.x = x
        self.y = y
        self.base = base
        self.height = height
        self.flipped = flipped
        self.glow_intensity = 1
        self.glow_direction = 5

    def move(self):
        self.x -= block_speed

    def is_outside(self):
        return self.x + self.base < 0

    def draw(self):
        # Smoothly adjust glow intensity
        self.glow_intensity += 0.002 * self.glow_direction  # Smaller step for smooth transition
        if self.glow_intensity >= 1.0:
            self.glow_intensity = 1.0
            self.glow_direction = -1  # Reverse direction
        elif self.glow_intensity <= 0.0:
            self.glow_intensity = 0.0
            self.glow_direction = 1  # Reverse direction

        # Set color with glow effect (use alpha blending for smooth glow)
        glColor4f(0.2, 0.8, 0.4, 0.6 + 0.4 * self.glow_intensity)

        glBegin(GL_TRIANGLES)
        if self.flipped:
            glVertex2f(self.x, self.y)
            glVertex2f(self.x + self.base / 2, self.y - self.height)
            glVertex2f(self.x + self.base, self.y)
        else:
            glVertex2f(self.x, self.y)
            glVertex2f(self.x + self.base / 2, self.y + self.height)
            glVertex2f(self.x + self.base, self.y)
        glEnd()

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
    glEnable(GL_BLEND)
    glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA)
    glMatrixMode(GL_PROJECTION)
    glLoadIdentity()
    glOrtho(0.0, W_Width, 0.0, W_Height, -1.0, 1.0)




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
